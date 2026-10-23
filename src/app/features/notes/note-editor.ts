import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArchive,
  lucideArchiveRestore,
  lucideArrowLeft,
  lucideBold,
  lucideCheck,
  lucideCircleAlert,
  lucideCode,
  lucideColumns2,
  lucideEye,
  lucideHeading2,
  lucideItalic,
  lucideLink,
  lucideList,
  lucideListChecks,
  lucideListOrdered,
  lucideMinus,
  lucidePencil,
  lucidePin,
  lucidePinOff,
  lucideQuote,
  lucideSquareCode,
  lucideStrikethrough,
  lucideTrash2,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { SearchService } from '../../core/ai/search.service';
import { PreferencesService } from '../../core/preferences.service';
import { relativeTime } from '../../shared/relative-time';
import { type EditorState, type MarkdownCommand, applyCommand, continueList } from './markdown-commands';
import { renderMarkdown, toggleTask } from './markdown';
import type { NotePatch } from './note';
import { NotesStore } from './notes.store';
import { TagInput } from './tag-input';

type Mode = 'edit' | 'split' | 'preview';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const MODE_KEY = 'locry.notes.mode';
const SAVE_DELAY_MS = 400;

interface ToolbarItem {
  command: MarkdownCommand;
  icon: string;
  shortcut?: string;
}

const TOOLBAR: ToolbarItem[][] = [
  [
    { command: 'bold', icon: 'lucideBold', shortcut: '⌘B' },
    { command: 'italic', icon: 'lucideItalic', shortcut: '⌘I' },
    { command: 'strike', icon: 'lucideStrikethrough' },
    { command: 'heading', icon: 'lucideHeading2' },
  ],
  [
    { command: 'bullet', icon: 'lucideList' },
    { command: 'numbered', icon: 'lucideListOrdered' },
    { command: 'task', icon: 'lucideListChecks' },
    { command: 'quote', icon: 'lucideQuote' },
  ],
  [
    { command: 'code', icon: 'lucideCode' },
    { command: 'codeBlock', icon: 'lucideSquareCode' },
    { command: 'link', icon: 'lucideLink', shortcut: '⌘K' },
    { command: 'divider', icon: 'lucideMinus' },
  ],
];

@Component({
  selector: 'app-note-editor',
  imports: [
    RouterLink,
    HlmAlertDialogImports,
    HlmButton,
    HlmSpinner,
    HlmToggleGroupImports,
    HlmTooltip,
    NgIcon,
    TagInput,
    TranslocoPipe,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideArchive,
      lucideArchiveRestore,
      lucideBold,
      lucideCheck,
      lucideCircleAlert,
      lucideCode,
      lucideColumns2,
      lucideEye,
      lucideHeading2,
      lucideItalic,
      lucideLink,
      lucideList,
      lucideListChecks,
      lucideListOrdered,
      lucideMinus,
      lucidePencil,
      lucidePin,
      lucidePinOff,
      lucideQuote,
      lucideSquareCode,
      lucideStrikethrough,
      lucideTrash2,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-full flex-col' },
  template: `
    @if (note(); as note) {
      <header class="flex items-center gap-1 border-b px-3 py-2">
        <a hlmBtn variant="ghost" size="icon-sm" routerLink="/notes" class="md:hidden" [attr.aria-label]="'pages.notes.back' | transloco">
          <ng-icon name="lucideArrowLeft" class="rtl:-scale-x-100" />
        </a>
        <hlm-toggle-group type="single" size="sm" [value]="mode()" (valueChange)="setMode($event)">
          @for (m of modes; track m.value) {
            <button hlmToggleGroupItem [value]="m.value" [hlmTooltip]="m.label | transloco" [aria-label]="m.label | transloco">
              <ng-icon [name]="m.icon" />
            </button>
          }
        </hlm-toggle-group>

        <span class="text-muted-foreground ms-2 flex flex-1 items-center gap-1.5 text-xs" aria-live="polite">
          @switch (saveState()) {
            @case ('saving') {
              <hlm-spinner class="size-3" />
              {{ 'pages.notes.saving' | transloco }}
            }
            @case ('saved') {
              <ng-icon name="lucideCheck" />
              {{ 'pages.notes.saved' | transloco }}
            }
            @case ('error') {
              <ng-icon name="lucideCircleAlert" class="text-destructive" />
              <span class="text-destructive">{{ 'pages.notes.saveFailed' | transloco }}</span>
            }
          }
        </span>

        <button
          hlmBtn
          variant="ghost"
          size="icon-sm"
          [hlmTooltip]="(note.pinned ? 'pages.notes.unpin' : 'pages.notes.pin') | transloco"
          [attr.aria-label]="(note.pinned ? 'pages.notes.unpin' : 'pages.notes.pin') | transloco"
          [attr.aria-pressed]="note.pinned"
          (click)="patch({ pinned: !note.pinned })"
        >
          <ng-icon [name]="note.pinned ? 'lucidePinOff' : 'lucidePin'" />
        </button>
        <button
          hlmBtn
          variant="ghost"
          size="icon-sm"
          [hlmTooltip]="(note.archived ? 'pages.notes.unarchive' : 'pages.notes.archive') | transloco"
          [attr.aria-label]="(note.archived ? 'pages.notes.unarchive' : 'pages.notes.archive') | transloco"
          (click)="toggleArchive()"
        >
          <ng-icon [name]="note.archived ? 'lucideArchiveRestore' : 'lucideArchive'" />
        </button>

        <hlm-alert-dialog>
          <button
            hlmAlertDialogTrigger
            hlmBtn
            variant="ghost"
            size="icon-sm"
            class="hover:text-destructive"
            [hlmTooltip]="'pages.notes.delete' | transloco"
            [attr.aria-label]="'pages.notes.delete' | transloco"
          >
            <ng-icon name="lucideTrash2" />
          </button>
          <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
            <hlm-alert-dialog-header>
              <h2 hlmAlertDialogTitle>{{ 'pages.notes.deleteTitle' | transloco }}</h2>
              <p hlmAlertDialogDescription>
                {{ 'pages.notes.deleteDescription' | transloco: { title: displayTitle() } }}
              </p>
            </hlm-alert-dialog-header>
            <hlm-alert-dialog-footer>
              <button hlmAlertDialogCancel>{{ 'pages.notes.cancel' | transloco }}</button>
              <button hlmAlertDialogAction variant="destructive" (click)="ctx.close(); deleteNote()">
                {{ 'pages.notes.delete' | transloco }}
              </button>
            </hlm-alert-dialog-footer>
          </hlm-alert-dialog-content>
        </hlm-alert-dialog>
      </header>

      <div class="flex flex-col gap-2 px-6 pt-5 pb-3">
        <input
          #titleInput
          class="placeholder:text-muted-foreground/60 w-full bg-transparent text-2xl font-semibold tracking-tight outline-none"
          [placeholder]="'pages.notes.titlePlaceholder' | transloco"
          [value]="title()"
          (input)="onTitle($any($event.target).value)"
          (keydown.enter)="$event.preventDefault(); focusEditor()"
        />
        <div class="flex flex-wrap items-center justify-between gap-2">
          <app-tag-input [tags]="note.tags" [suggestions]="store.allTags()" (added)="addTag($event)" (removed)="removeTag($event)" />
          <span class="text-muted-foreground text-xs">
            {{ 'pages.notes.updated' | transloco: { time: updatedLabel() } }}
          </span>
        </div>
      </div>

      @if (mode() !== 'preview') {
        <div class="flex flex-wrap items-center gap-0.5 border-y px-4 py-1" role="toolbar">
          @for (group of toolbar; track $index; let last = $last) {
            @for (item of group; track item.command) {
              <button
                hlmBtn
                variant="ghost"
                size="icon-sm"
                [hlmTooltip]="tooltip(item)"
                [attr.aria-label]="'pages.notes.toolbar.' + item.command | transloco"
                (mousedown)="$event.preventDefault()"
                (click)="apply(item.command)"
              >
                <ng-icon [name]="item.icon" />
              </button>
            }
            @if (!last) {
              <span class="bg-border mx-1 h-4 w-px"></span>
            }
          }
        </div>
      }

      <div class="grid min-h-0 flex-1" [class.grid-cols-2]="mode() === 'split'">
        @if (mode() !== 'preview') {
          <textarea
            #editor
            class="placeholder:text-muted-foreground/60 h-full w-full resize-none bg-transparent px-6 py-4 font-mono text-sm leading-relaxed outline-none"
            spellcheck="true"
            [placeholder]="'pages.notes.contentPlaceholder' | transloco"
            [value]="content()"
            (input)="onContent($any($event.target).value)"
            (keydown)="onEditorKeydown($event)"
          ></textarea>
        }
        @if (mode() !== 'edit') {
          <article
            class="markdown-preview prose prose-sm dark:prose-invert max-w-none overflow-y-auto px-6 py-4"
            [class.border-s]="mode() === 'split'"
            (click)="onPreviewClick($event)"
          >
            @if (content().trim()) {
              <div [innerHTML]="previewHtml()"></div>
            } @else {
              <p class="text-muted-foreground">{{ 'pages.notes.previewEmpty' | transloco }}</p>
            }
          </article>
        }
      </div>

      <footer class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-6 py-1.5 text-xs">
        <span class="tabular-nums">{{ 'pages.notes.words' | transloco: { count: wordCount() } }}</span>
        @if (similar().length) {
          <span class="flex min-w-0 flex-wrap items-center gap-1.5" data-testid="similar-notes">
            <span>{{ 'pages.search.similarNotes' | transloco }}:</span>
            @for (item of similar(); track item.doc.id) {
              <a [routerLink]="['/notes', item.doc.id]" class="bg-muted hover:bg-accent max-w-48 truncate rounded px-1.5 py-0.5 text-foreground">
                {{ item.doc.title || ('pages.notes.untitled' | transloco) }}
              </a>
            }
          </span>
        }
      </footer>
    }
  `,
})
export class NoteEditor {
  /** Route parameter, bound through `withComponentInputBinding`. */
  readonly id = input.required<string>();

  protected readonly store = inject(NotesStore);
  private readonly router = inject(Router);
  private readonly prefs = inject(PreferencesService);
  private readonly transloco = inject(TranslocoService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');
  private readonly editor = viewChild<ElementRef<HTMLTextAreaElement>>('editor');

  protected readonly toolbar = TOOLBAR;
  protected readonly modes: { value: Mode; icon: string; label: string }[] = [
    { value: 'edit', icon: 'lucidePencil', label: 'pages.notes.edit' },
    { value: 'split', icon: 'lucideColumns2', label: 'pages.notes.split' },
    { value: 'preview', icon: 'lucideEye', label: 'pages.notes.preview' },
  ];

  protected readonly note = computed(() => this.store.byId(this.id()));
  protected readonly title = signal('');
  protected readonly content = signal('');
  protected readonly mode = signal<Mode>(this.initialMode());
  protected readonly saveState = signal<SaveState>('idle');

  protected readonly previewHtml = computed(() =>
    // renderMarkdown sanitizes with DOMPurify; Angular's sanitizer would strip task checkboxes.
    this.sanitizer.bypassSecurityTrustHtml(renderMarkdown(this.content())),
  );
  private readonly search = inject(SearchService);
  /** Notes close in meaning, when semantic search is on and this note is indexed. */
  protected readonly similar = computed(() => this.search.similarNotes(this.id()));
  protected readonly wordCount = computed(() => this.content().split(/\s+/).filter(Boolean).length);
  protected readonly displayTitle = computed(
    () => this.title().trim() || this.transloco.translate('pages.notes.untitled'),
  );
  protected readonly updatedLabel = computed(() => {
    const note = this.note();
    return note ? relativeTime(note.updatedAt, this.prefs.lang()) : '';
  });

  private loadedId: string | null = null;
  private saveTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Load the drafts whenever the route switches to another note.
    effect(() => {
      const id = this.id();
      const loaded = this.store.loaded();
      untracked(() => {
        if (!loaded || id === this.loadedId) return;
        void this.leaveCurrent();
        const note = this.store.byId(id);
        if (!note) {
          void this.router.navigate(['/notes'], { replaceUrl: true });
          return;
        }
        this.loadedId = id;
        this.title.set(note.title);
        this.content.set(note.content);
        this.saveState.set('idle');
        if (history.state?.focusTitle) {
          history.replaceState({ ...history.state, focusTitle: false }, '');
          setTimeout(() => this.titleInput()?.nativeElement.focus());
        }
      });
    });

    inject(DestroyRef).onDestroy(() => void this.leaveCurrent());
  }

  protected setMode(value: unknown): void {
    if (value !== 'edit' && value !== 'split' && value !== 'preview') return;
    this.mode.set(value);
    localStorage.setItem(MODE_KEY, value);
  }

  protected onTitle(value: string): void {
    this.title.set(value);
    this.scheduleSave();
  }

  protected onContent(value: string): void {
    this.content.set(value);
    this.scheduleSave();
  }

  protected focusEditor(): void {
    this.editor()?.nativeElement.focus();
  }

  protected tooltip(item: ToolbarItem): string {
    const label = this.transloco.translate(`pages.notes.toolbar.${item.command}`);
    return item.shortcut ? `${label} (${item.shortcut})` : label;
  }

  protected apply(command: MarkdownCommand): void {
    const placeholder = this.transloco.translate('pages.notes.toolbar.placeholder');
    this.updateEditor((state) => applyCommand(state, command, placeholder));
  }

  protected onEditorKeydown(event: KeyboardEvent): void {
    const mod = event.metaKey || event.ctrlKey;
    const shortcuts: Record<string, MarkdownCommand> = { b: 'bold', i: 'italic', k: 'link' };
    if (mod && !event.shiftKey && !event.altKey && shortcuts[event.key.toLowerCase()]) {
      event.preventDefault();
      this.apply(shortcuts[event.key.toLowerCase()]);
      return;
    }
    if (event.key === 'Enter' && !mod && !event.shiftKey && !event.isComposing) {
      const handled = this.updateEditor((state) => continueList(state));
      if (handled) event.preventDefault();
    }
  }

  protected onPreviewClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') return;
    const index = Number(target.dataset['taskIndex']);
    if (Number.isNaN(index)) return;
    this.onContent(toggleTask(this.content(), index));
  }

  protected async patch(patch: NotePatch): Promise<void> {
    await this.store.update(this.id(), patch);
  }

  protected addTag(tag: string): void {
    const tags = this.note()?.tags ?? [];
    if (!tags.includes(tag)) void this.patch({ tags: [...tags, tag] });
  }

  protected removeTag(tag: string): void {
    void this.patch({ tags: (this.note()?.tags ?? []).filter((t) => t !== tag) });
  }

  protected async toggleArchive(): Promise<void> {
    const archived = !this.note()?.archived;
    await this.flush();
    await this.patch({ archived });
    if (archived) toast.success(this.transloco.translate('pages.notes.archivedToast'));
  }

  protected async deleteNote(): Promise<void> {
    clearTimeout(this.saveTimer);
    const id = this.id();
    this.loadedId = null;
    await this.store.remove(id);
    toast.success(this.transloco.translate('pages.notes.deleted'));
    await this.router.navigate(['/notes'], { replaceUrl: true });
  }

  /**
   * Runs an editor transformation against the textarea's current selection and writes the
   * result back, keeping the caret where the transformation put it.
   */
  private updateEditor(transform: (state: EditorState) => EditorState | null): boolean {
    const textarea = this.editor()?.nativeElement;
    if (!textarea) return false;
    const next = transform({ value: textarea.value, start: textarea.selectionStart, end: textarea.selectionEnd });
    if (!next) return false;
    textarea.value = next.value;
    textarea.focus();
    textarea.setSelectionRange(next.start, next.end);
    this.onContent(next.value);
    return true;
  }

  private scheduleSave(): void {
    this.saveState.set('saving');
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.flush(), SAVE_DELAY_MS);
  }

  /** Writes pending edits. Reads the drafts synchronously, before any await. */
  private async flush(id = this.loadedId): Promise<void> {
    clearTimeout(this.saveTimer);
    const note = id ? this.store.byId(id) : undefined;
    if (!id || !note) return;
    if (note.title === this.title() && note.content === this.content()) {
      if (this.saveState() === 'saving') this.saveState.set('saved');
      return;
    }
    try {
      await this.store.update(id, { title: this.title(), content: this.content() });
      if (this.loadedId === id) this.saveState.set('saved');
    } catch (error) {
      console.error(error);
      if (this.loadedId === id) this.saveState.set('error');
    }
  }

  /** Saves pending edits of the current note and drops it if it was left completely empty. */
  private async leaveCurrent(): Promise<void> {
    const id = this.loadedId;
    if (!id) return;
    // Detach first: the next note may be loaded while this save is still in flight.
    const pending = this.flush(id);
    this.loadedId = null;
    await pending;
    const note = this.store.byId(id);
    if (note && !note.title.trim() && !note.content.trim() && !note.tags.length) {
      await this.store.remove(id);
    }
  }

  private initialMode(): Mode {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === 'edit' || stored === 'split' || stored === 'preview') return stored;
    return window.matchMedia('(min-width: 1280px)').matches ? 'split' : 'edit';
  }
}
