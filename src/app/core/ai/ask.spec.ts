import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { TasksStore } from '../../features/tasks/tasks.store';
import { PreferencesService } from '../preferences.service';
import { VaultService } from '../vault/vault.service';
import { CONTEXT_CHARS, buildAskMessages, citationParts, formatSources, plainAnswer, type AskSource } from './ask-prompt';
import { AskService } from './ask.service';
import { type ChatMessage, loopCut, stripThinking } from './chat-protocol';
import { ChatModelService } from './chat.service';
import { SearchService } from './search.service';

const hotel: AskSource = { kind: 'note', id: 'n1', title: 'Hotel booking in Lisbon', body: 'Hotel booked: July 12–18.' };
const dentist: AskSource = { kind: 'task', id: 't1', title: 'Book a dentist appointment', body: '', dueDate: '2026-10-26', done: false };

describe('ask prompt', () => {
  it('numbers the sources, states task status and names the answer language', () => {
    const messages = buildAskMessages({ question: 'When is my hotel?', sources: [hotel, dentist], history: [], language: 'Turkish', today: '2026-10-26' });
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('Always answer in Turkish.');
    expect(messages[0].content).toContain('Today is 2026-10-26.');
    const user = messages.at(-1)!;
    expect(user.role).toBe('user');
    expect(user.content).toContain('[1] Note: Hotel booking in Lisbon\nHotel booked: July 12–18.');
    expect(user.content).toContain('[2] Task: Book a dentist appointment (due 2026-10-26)');
    expect(user.content.endsWith('Question: When is my hotel?')).toBe(true);
  });

  it('keeps only the last two exchanges for follow-up questions', () => {
    const history = [1, 2, 3].map((i) => ({ question: `q${i}`, answer: `a${i}` }));
    const messages = buildAskMessages({ question: 'q4', sources: [], history, language: 'English', today: '2026-10-26' });
    expect(messages.map((m) => m.content).slice(1, -1)).toEqual(['q2', 'a2', 'q3', 'a3']);
    expect(messages.at(-1)!.content).toContain('(No notes or tasks found.)');
  });

  it('trims long sources to the context budget', () => {
    const long = Array.from({ length: 8 }, (_, i) => ({ ...hotel, id: `n${i}`, body: 'x'.repeat(5000) }));
    const text = formatSources(long);
    expect(text.length).toBeLessThan(CONTEXT_CHARS + 200);
    expect(text).toContain('…');
  });

  it('turns citation numbers into links and drops ones without a source', () => {
    expect(citationParts('July 12 [1], dentist [2] and lunch [7].', 2)).toEqual([
      { text: 'July 12 ' },
      { cite: 1 },
      { text: ', dentist ' },
      { cite: 2 },
      { text: ' and lunch' },
      { text: '.' },
    ]);
  });

  it('finds a line repeated three times and cuts at its second appearance', () => {
    const text = 'Answer.\nThe hotel is booked for July.\nOther line here.\nThe hotel is booked for July.\nThe hotel is booked for July.';
    expect(text.slice(0, loopCut(text)!).trimEnd()).toBe('Answer.\nThe hotel is booked for July.\nOther line here.');
    expect(loopCut('short\nshort\nshort')).toBeNull();
  });

  it('shows Markdown answers as plain text with bullets', () => {
    expect(plainAnswer('Tasks:\n\n\n*   **Pay** the rent [1]\n- Gym\n## Done')).toBe('Tasks:\n\n• Pay the rent [1]\n• Gym\nDone');
  });

  it('drops reasoning blocks, also while one is still being written', () => {
    expect(stripThinking('<think>\n\n</think>\n\nAnswer')).toBe('Answer');
    expect(stripThinking('<think>still thinking')).toBe('');
  });
});

describe('AskService', () => {
  const unlocked = signal(true);
  let found: { doc: object; score: number }[];
  let tasks: object[];
  let agendaQuestion: boolean | null;
  let generated: ChatMessage[][];
  let reply = '<think></think>Your hotel is booked for July 12–18 [1].';

  const model = {
    spec: signal({ name: 'Fake' }),
    status: signal<'ready'>('ready'),
    progress: signal(1),
    start: async () => {},
    stop: () => {},
    interrupt: () => {},
    generate: async (messages: ChatMessage[], onToken: (piece: string) => void) => {
      generated.push(messages);
      for (const piece of reply.match(/.{1,8}/g)!) onToken(piece);
      return reply;
    },
  };

  function setup(): AskService {
    generated = [];
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ChatModelService, useValue: model },
        { provide: VaultService, useValue: { isUnlocked: unlocked, activeVault: signal(null), vaults: signal([]), status: signal('unlocked') } },
        { provide: SearchService, useValue: { search: async () => found, closerToTexts: async () => agendaQuestion } },
        { provide: TasksStore, useValue: { taskById: () => undefined, tasks: () => tasks } },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
      ],
    });
    TestBed.inject(PreferencesService).setAsk({ askEnabled: true });
    return TestBed.inject(AskService);
  }

  beforeEach(() => {
    localStorage.clear();
    unlocked.set(true);
    found = [{ doc: { kind: 'note', id: 'n1', title: hotel.title, body: hotel.body }, score: 0.9 }];
    tasks = [];
    agendaQuestion = false;
  });

  it('answers from the found notes and keeps the sources for citations', async () => {
    const ask = setup();
    await ask.ask('When is my hotel?');
    const [exchange] = ask.exchanges();
    expect(exchange.state).toBe('done');
    expect(exchange.answer).toBe('Your hotel is booked for July 12–18 [1].');
    expect(exchange.sources.map((s) => s.id)).toEqual(['n1']);
    expect(generated[0].at(-1)!.content).toContain('[1] Note: Hotel booking in Lisbon');
  });

  it('says it found nothing, without asking the model, when there are no sources', async () => {
    found = [];
    const ask = setup();
    await ask.ask('Where is my passport?');
    expect(ask.exchanges()[0].state).toBe('done');
    expect(ask.exchanges()[0].answer).toBe('ask.notFound');
    expect(generated).toEqual([]);
  });

  it('leaves out weak matches', async () => {
    found = [...found, { doc: { kind: 'note', id: 'n2', title: 'Weak', body: '' }, score: 0.3 }];
    const ask = setup();
    await ask.ask('When is my hotel?');
    expect(ask.exchanges()[0].sources.map((s) => s.id)).toEqual(['n1']);
  });

  it('answers questions about the agenda from the open tasks due soon', async () => {
    const today = new Date().toISOString().slice(0, 10);
    tasks = [
      { id: 't1', title: 'Pay the rent', notes: '', subtasks: [], done: false, dueDate: today, priority: 2 },
      { id: 't2', title: 'Done already', notes: '', subtasks: [], done: true, dueDate: today, priority: 0 },
      { id: 't3', title: 'No date', notes: '', subtasks: [], done: false, dueDate: null, priority: 0 },
    ];
    agendaQuestion = true;
    const ask = setup();
    await ask.ask('What do I have to do today?');
    expect(ask.exchanges()[0].sources.map((s) => s.id)).toEqual(['t1']);

    // Without smart search the agenda is only a fallback when nothing was found.
    agendaQuestion = null;
    await ask.ask('When is my hotel?');
    expect(ask.exchanges()[1].sources.map((s) => s.id)).toEqual(['n1']);
    found = [];
    await ask.ask('What do I have to do today?');
    expect(ask.exchanges()[2].sources.map((s) => s.id)).toEqual(['t1']);
  });

  it('passes earlier answers along for follow-up questions', async () => {
    const ask = setup();
    await ask.ask('When is my hotel?');
    await ask.ask('And which city?');
    expect(generated[1].map((m) => m.role)).toEqual(['system', 'user', 'assistant', 'user']);
  });

  it('forgets the conversation when the vault locks', async () => {
    const ask = setup();
    await ask.ask('When is my hotel?');
    unlocked.set(false);
    TestBed.tick();
    expect(ask.exchanges()).toEqual([]);
  });
});
