import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { TasksStore } from '../../features/tasks/tasks.store';
import { LANGUAGE_ENGLISH_NAMES } from '../languages';
import { PreferencesService } from '../preferences.service';
import { VaultService } from '../vault/vault.service';
import { type AskSource, buildAskMessages } from './ask-prompt';
import { type ChatModelId, stripThinking } from './chat-protocol';
import { ChatModelService } from './chat.service';
import { pruneModelCache } from './model-cache';
import { SearchService } from './search.service';

/** How many search results the model gets to read. */
const SOURCE_LIMIT = 5;
/** Results scoring below this share of the best one only distract a small model. */
const MIN_RELATIVE_SCORE = 0.6;
/**
 * Questions like "what do I have to do today?" share no words or meaning with any single
 * task. When a question is closer in meaning to these descriptions of the agenda than to any
 * found note (or nothing was found at all), the open tasks due within a week are given to
 * the model instead. One per language, so it works whatever language the user writes in.
 */
const AGENDA_TEXTS = [
  'My tasks for today and this week: what I have to do, what is due and what is overdue.',
  'Bugün ve bu haftaki görevlerim: ne yapmam gerekiyor, neyin tarihi geliyor, neler gecikti.',
  '我今天和本周的任务：我要做什么，什么快到期了，什么已经逾期。',
  'Mis tareas de hoy y de esta semana: qué tengo que hacer, qué vence y qué está atrasado.',
  'مهامي لليوم ولهذا الأسبوع: ما الذي عليّ فعله، وما الذي يحين موعده، وما المتأخر.',
  'Minhas tarefas de hoje e desta semana: o que tenho de fazer, o que vence e o que está atrasado.',
  'Tugas saya hari ini dan minggu ini: apa yang harus saya kerjakan, apa yang jatuh tempo, apa yang terlambat.',
  'Mes tâches d’aujourd’hui et de cette semaine : ce que je dois faire, ce qui arrive à échéance, ce qui est en retard.',
  '今日と今週のタスク：やるべきこと、期限が近いもの、期限切れのもの。',
  'Мои задачи на сегодня и на эту неделю: что нужно сделать, у чего подходит срок, что просрочено.',
  'Meine Aufgaben für heute und diese Woche: was ich erledigen muss, was fällig ist und was überfällig ist.',
];
const AGENDA_DAYS = 7;
const AGENDA_LIMIT = 6;

export type AskState = 'searching' | 'loading' | 'writing' | 'done' | 'stopped' | 'error';

export interface AskExchange {
  id: number;
  question: string;
  answer: string;
  sources: AskSource[];
  state: AskState;
}

/**
 * "Ask your notes": finds the notes and tasks related to a question with the hybrid search,
 * then lets a small language model answer from them, citing its sources. Everything runs in
 * the browser; the conversation lives in memory only and is dropped when the vault locks.
 */
@Injectable({ providedIn: 'root' })
export class AskService {
  private readonly prefs = inject(PreferencesService);
  private readonly vault = inject(VaultService);
  private readonly search = inject(SearchService);
  private readonly tasks = inject(TasksStore);
  private readonly transloco = inject(TranslocoService);
  readonly model = inject(ChatModelService);

  private readonly _exchanges = signal<AskExchange[]>([]);
  readonly exchanges = this._exchanges.asReadonly();
  readonly busy = computed(() => this._exchanges().some((e) => e.state === 'searching' || e.state === 'loading' || e.state === 'writing'));
  readonly enabled = computed(() => this.prefs.askEnabled());
  private nextId = 1;

  constructor() {
    // Nothing of the notes may outlive the open vault: drop the conversation and the model's memory.
    effect(() => {
      const open = this.vault.isUnlocked() && this.enabled();
      untracked(() => {
        if (open) return;
        this.model.stop();
        this._exchanges.set([]);
      });
    });
  }

  /** Turns the feature on with the given model and starts loading it. */
  async enable(id: ChatModelId): Promise<void> {
    this.prefs.setAsk({ askEnabled: true, askModel: id });
    await this.start();
  }

  /** Loads the model, then deletes files of models no longer used. */
  async start(): Promise<void> {
    await this.model.start();
    await pruneModelCache(this.prefs.modelReposInUse()).catch((error) => console.error(error));
  }

  /** Switches to another model; the previous one's files are deleted once the new one loads. */
  async setModel(id: ChatModelId): Promise<void> {
    if (id === this.prefs.askModel()) return;
    this.model.stop();
    this.prefs.setAsk({ askModel: id });
    if (this.enabled()) await this.start();
  }

  /** Turns the feature off and deletes the downloaded language model. */
  async disable(): Promise<void> {
    this.prefs.setAsk({ askEnabled: false });
    this.model.stop();
    this._exchanges.set([]);
    await pruneModelCache(this.prefs.modelReposInUse()).catch((error) => console.error(error));
  }

  clear(): void {
    if (this.busy()) this.model.interrupt();
    this._exchanges.set([]);
  }

  async ask(question: string): Promise<void> {
    question = question.trim();
    if (!question || this.busy()) return;
    const id = this.nextId++;
    const history = this._exchanges()
      .filter((e) => e.state === 'done' && e.answer)
      .map(({ question, answer }) => ({ question, answer }));
    this._exchanges.update((list) => [...list, { id, question, answer: '', sources: [], state: 'searching' }]);

    try {
      const sources = await this.findSources(question);
      // Nothing to answer from: say so instead of letting the model make something up.
      if (!sources.length) {
        this.patch(id, { answer: this.transloco.translate('ask.notFound'), state: 'done' });
        return;
      }
      this.patch(id, { sources, state: 'loading' });
      await this.start();
      this.patch(id, { state: 'writing' });

      const messages = buildAskMessages({
        question,
        sources,
        history,
        language: LANGUAGE_ENGLISH_NAMES[this.prefs.lang()],
        today: localDate(new Date()),
      });
      let raw = '';
      const full = await this.model.generate(messages, (piece) => {
        raw += piece;
        this.patch(id, { answer: stripThinking(raw) });
      });
      const stopped = this.current(id)?.state === 'stopped';
      this.patch(id, { answer: stripThinking(full).trim(), state: stopped ? 'stopped' : 'done' });
    } catch (error) {
      console.error(error);
      // Locking the vault clears the conversation; nothing to report then.
      if (this.current(id)) this.patch(id, { state: 'error' });
    }
  }

  /** Marks the answer being written as stopped by the user. */
  interrupt(): void {
    const writing = this._exchanges().find((e) => e.state === 'writing');
    if (writing) this.patch(writing.id, { state: 'stopped' });
    this.model.interrupt();
  }

  private async findSources(question: string): Promise<AskSource[]> {
    const found = await this.search.search(question, { limit: SOURCE_LIMIT });
    const best = found[0]?.score ?? 0;
    const results = found.filter((r) => r.score >= best * MIN_RELATIVE_SCORE);
    const sources: AskSource[] = results.map(({ doc }) => {
      const task = doc.kind === 'task' ? this.tasks.taskById(doc.id) : undefined;
      return {
        kind: doc.kind,
        id: doc.id,
        title: doc.title,
        body: doc.body,
        ...(task ? { dueDate: task.dueDate, done: task.done } : {}),
      };
    });
    const wantsAgenda = results.length ? await this.search.closerToTexts(question, AGENDA_TEXTS, results) : true;
    const due = wantsAgenda ? this.agenda() : [];
    if (!due.length) return sources;
    const tasks = sources.filter((s) => s.kind === 'task' && !due.some((d) => d.id === s.id));
    return [...due, ...tasks];
  }

  /** Open tasks due within a week (overdue ones first), as sources. */
  private agenda(): AskSource[] {
    const horizon = localDate(new Date(Date.now() + AGENDA_DAYS * 86_400_000));
    return this.tasks
      .tasks()
      .filter((t) => !t.done && t.dueDate && t.dueDate <= horizon)
      .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!) || b.priority - a.priority)
      .slice(0, AGENDA_LIMIT)
      .map((t) => ({
        kind: 'task' as const,
        id: t.id,
        title: t.title,
        body: [t.notes, ...t.subtasks.map((s) => s.title)].filter(Boolean).join('\n'),
        dueDate: t.dueDate,
        done: t.done,
      }));
  }

  private current(id: number): AskExchange | undefined {
    return this._exchanges().find((e) => e.id === id);
  }

  private patch(id: number, patch: Partial<AskExchange>): void {
    this._exchanges.update((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
}

/** `YYYY-MM-DD` in the device's time zone (task due dates are local dates). */
function localDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
