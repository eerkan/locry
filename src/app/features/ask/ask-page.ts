import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowUp,
  lucideCircleCheck,
  lucideFileText,
  lucideMessageSquarePlus,
  lucideShieldCheck,
  lucideSparkles,
  lucideSquare,
  lucideSquareCheck,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { type AskSource, citationParts, plainAnswer } from '../../core/ai/ask-prompt';
import { type AskExchange, AskService } from '../../core/ai/ask.service';
import { CHAT_MODELS, type ChatModelId } from '../../core/ai/chat-protocol';
import { SemanticIndexService } from '../../core/ai/semantic-index.service';
import { PreferencesService } from '../../core/preferences.service';
import { AskModelPicker } from '../../shared/ask-model-picker';
import { resultLink } from '../../shared/result-link';
import { TasksStore } from '../tasks/tasks.store';

/** "Ask your notes": a conversation answered from the vault's own notes and tasks. */
@Component({
  selector: 'app-ask-page',
  imports: [AskModelPicker, HlmButton, HlmSpinner, HlmTextarea, NgIcon, RouterLink, TranslocoPipe],
  providers: [
    provideIcons({
      lucideArrowUp,
      lucideCircleCheck,
      lucideFileText,
      lucideMessageSquarePlus,
      lucideShieldCheck,
      lucideSparkles,
      lucideSquare,
      lucideSquareCheck,
      lucideTriangleAlert,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-full flex-col' },
  template: `
    <div class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5">
      @if (!ask.enabled()) {
        <section class="flex flex-col gap-5 rounded-xl border p-5 sm:p-6">
          <div class="flex items-start gap-3">
            <ng-icon name="lucideSparkles" class="text-primary mt-0.5 shrink-0 text-xl" />
            <div class="flex flex-col gap-1">
              <h1 class="text-lg font-semibold">{{ 'ask.title' | transloco }}</h1>
              <p class="text-muted-foreground text-sm">{{ 'ask.description' | transloco }}</p>
            </div>
          </div>
          @if (!webgpu) {
            <p class="text-destructive flex items-start gap-2 text-sm">
              <ng-icon name="lucideTriangleAlert" class="mt-0.5 shrink-0" />{{ 'ask.noWebgpu' | transloco }}
            </p>
          }
          <app-ask-model-picker [value]="choice()" (valueChange)="choice.set($event)" />
          <p class="text-muted-foreground flex items-start gap-2 text-xs">
            <ng-icon name="lucideShieldCheck" class="mt-0.5 shrink-0" />{{ 'ask.privacy' | transloco }}
          </p>
          <div class="flex justify-end">
            <button hlmBtn [disabled]="!webgpu" (click)="enable()">
              {{ 'ask.start' | transloco: { size: models[choice()].downloadMb.q4f16 } }}
            </button>
          </div>
        </section>
      } @else {
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="text-muted-foreground flex items-center gap-2 text-xs" aria-live="polite">
            @switch (ask.model.status()) {
              @case ('ready') {
                <ng-icon name="lucideCircleCheck" class="text-green-600 dark:text-green-500" />
                {{ 'ask.ready' | transloco: { model: ask.model.spec().name } }}
              }
              @case ('unsupported') {
                <ng-icon name="lucideTriangleAlert" class="text-destructive" />
                <span class="text-destructive">{{ 'ask.noWebgpu' | transloco }}</span>
              }
              @case ('error') {
                <ng-icon name="lucideTriangleAlert" class="text-destructive" />
                <span class="text-destructive">{{ 'ask.error' | transloco }}</span>
                <button hlmBtn variant="link" size="xs" (click)="start()">{{ 'ask.retry' | transloco }}</button>
              }
              @case ('loading') {
                <hlm-spinner class="size-3" />
                @if (percent() > 0 && percent() < 100) {
                  {{ 'ask.loading' | transloco: { percent: percent() } }}
                  <span class="bg-muted relative h-1.5 w-32 overflow-hidden rounded-full">
                    <span class="bg-primary absolute inset-y-0 start-0 transition-all" [style.width.%]="percent()"></span>
                  </span>
                } @else {
                  {{ 'ask.starting' | transloco }}
                }
              }
              @default {
                {{ ask.model.spec().name }}
              }
            }
          </div>
          @if (ask.exchanges().length) {
            <button hlmBtn variant="ghost" size="sm" (click)="ask.clear()">
              <ng-icon name="lucideMessageSquarePlus" />{{ 'ask.newChat' | transloco }}
            </button>
          }
        </div>

        @if (!index.enabled()) {
          <p class="bg-muted/50 text-muted-foreground rounded-lg border p-3 text-xs">
            {{ 'ask.smartSearchHint' | transloco }}
            <a routerLink="/search" class="text-foreground underline underline-offset-2">{{ 'nav.search' | transloco }}</a>
          </p>
        }

        <div class="flex flex-1 flex-col gap-6" aria-live="polite">
          @for (exchange of ask.exchanges(); track exchange.id) {
            <article animate.enter="item-enter" class="flex flex-col gap-3">
              <p class="bg-primary text-primary-foreground max-w-[85%] self-end rounded-2xl rounded-ee-sm px-4 py-2.5 text-sm whitespace-pre-wrap">
                {{ exchange.question }}
              </p>
              <div class="flex flex-col gap-3">
                @switch (exchange.state) {
                  @case ('searching') {
                    <p class="text-muted-foreground flex items-center gap-2 text-sm"><hlm-spinner class="size-3" />{{ 'ask.searching' | transloco }}</p>
                  }
                  @case ('loading') {
                    <p class="text-muted-foreground flex items-center gap-2 text-sm"><hlm-spinner class="size-3" />{{ 'ask.starting' | transloco }}</p>
                  }
                  @case ('error') {
                    <p class="text-destructive flex items-center gap-2 text-sm"><ng-icon name="lucideTriangleAlert" />{{ 'ask.failed' | transloco }}</p>
                  }
                }
                @if (exchange.answer || exchange.state === 'writing') {
                  <!-- One line: the paragraph keeps whitespace, so template indentation would show. -->
                  <p class="text-sm leading-relaxed whitespace-pre-wrap" data-testid="ask-answer">@for (part of parts(exchange); track $index) {@if ('cite' in part) {<a class="bg-muted hover:bg-accent mx-0.5 inline-flex min-w-5 items-center justify-center rounded px-1 align-baseline text-[11px] font-medium" [routerLink]="link(exchange.sources[part.cite - 1]).commands" [queryParams]="link(exchange.sources[part.cite - 1]).queryParams" [attr.title]="exchange.sources[part.cite - 1].title">{{ part.cite }}</a>} @else {{{ part.text }}}}@if (exchange.state === 'writing') {<span class="bg-foreground/60 ms-0.5 inline-block h-3.5 w-1.5 animate-pulse align-middle"></span>}</p>
                }
                @if (exchange.state === 'stopped') {
                  <p class="text-muted-foreground text-xs">{{ 'ask.stopped' | transloco }}</p>
                }
                @if (exchange.state !== 'searching') {
                  @if (exchange.sources.length) {
                    <div class="flex flex-col gap-1.5">
                      <p class="text-muted-foreground text-xs font-medium">{{ 'ask.sources' | transloco }}</p>
                      <ol class="flex flex-wrap gap-1.5">
                        @for (source of exchange.sources; track source.kind + source.id; let i = $index) {
                          <li>
                            <a
                              class="hover:bg-accent flex max-w-64 items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors"
                              [routerLink]="link(source).commands"
                              [queryParams]="link(source).queryParams"
                            >
                              <span class="text-muted-foreground">{{ i + 1 }}</span>
                              <ng-icon [name]="source.kind === 'note' ? 'lucideFileText' : 'lucideSquareCheck'" class="text-muted-foreground shrink-0" />
                              <span class="truncate">{{ source.title || ((source.kind === 'note' ? 'pages.notes.untitled' : 'pages.tasks.untitled') | transloco) }}</span>
                            </a>
                          </li>
                        }
                      </ol>
                    </div>
                  } @else {
                    <p class="text-muted-foreground text-xs">{{ 'ask.noSources' | transloco }}</p>
                  }
                }
              </div>
            </article>
          } @empty {
            <p class="text-muted-foreground py-10 text-center text-sm">{{ 'ask.empty' | transloco }}</p>
          }
        </div>

        <form
          class="bg-background sticky bottom-0 flex flex-col gap-2 pb-1"
          (submit)="$event.preventDefault(); send()"
        >
          <div class="relative">
            <textarea
              #input
              hlmTextarea
              rows="2"
              class="max-h-40 min-h-14 w-full resize-none pe-12 text-sm"
              [placeholder]="'ask.placeholder' | transloco"
              [attr.aria-label]="'ask.placeholder' | transloco"
              [value]="draft()"
              (input)="draft.set($any($event.target).value)"
              (keydown.enter)="onEnter($any($event))"
            ></textarea>
            @if (ask.busy()) {
              <button hlmBtn type="button" size="icon-sm" variant="outline" class="absolute end-2 bottom-2" [attr.aria-label]="'ask.stop' | transloco" (click)="ask.interrupt()">
                <ng-icon name="lucideSquare" />
              </button>
            } @else {
              <button
                hlmBtn
                type="submit"
                size="icon-sm"
                class="absolute end-2 bottom-2"
                [disabled]="!draft().trim() || ask.model.status() === 'unsupported'"
                [attr.aria-label]="'ask.send' | transloco"
              >
                <ng-icon name="lucideArrowUp" />
              </button>
            }
          </div>
          <p class="text-muted-foreground text-center text-[11px]">{{ 'ask.disclaimer' | transloco }}</p>
        </form>
      }
    </div>
  `,
})
export class AskPage {
  protected readonly ask = inject(AskService);
  protected readonly index = inject(SemanticIndexService);
  private readonly prefs = inject(PreferencesService);
  private readonly tasks = inject(TasksStore);

  protected readonly models = CHAT_MODELS;
  protected readonly webgpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
  protected readonly choice = signal<ChatModelId>(this.prefs.askModel());
  protected readonly draft = signal('');
  protected readonly percent = computed(() => Math.round(this.ask.model.progress() * 100));
  private readonly input = viewChild<ElementRef<HTMLTextAreaElement>>('input');

  constructor() {
    // Load the model as soon as the page opens, so the first answer does not wait for it.
    effect(() => {
      if (!this.ask.enabled()) return;
      untracked(() => {
        if (this.ask.model.status() === 'off') void this.start();
      });
    });
    afterNextRender(() => this.input()?.nativeElement.focus());
  }

  protected start(): Promise<void> {
    return this.ask.start().catch((error) => console.error(error));
  }

  protected enable(): void {
    void this.ask.enable(this.choice()).catch((error) => console.error(error));
  }

  protected send(): void {
    const question = this.draft();
    if (!question.trim() || this.ask.busy()) return;
    this.draft.set('');
    void this.ask.ask(question);
  }

  /** Enter sends, Shift+Enter starts a new line. */
  protected onEnter(event: KeyboardEvent): void {
    if (event.shiftKey || event.isComposing) return;
    event.preventDefault();
    this.send();
  }

  protected parts(exchange: AskExchange) {
    return citationParts(plainAnswer(exchange.answer), exchange.sources.length);
  }

  protected link(source: AskSource) {
    return resultLink(source, (id) => this.tasks.taskById(id));
  }
}
