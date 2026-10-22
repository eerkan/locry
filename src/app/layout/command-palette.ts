import { ChangeDetectionStrategy, Component, computed, effect, inject, model, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideFileText,
  lucideListTodo,
  lucideLock,
  lucideNotebookPen,
  lucidePlus,
  lucideSearch,
  lucideSettings,
  lucideSquareCheck,
  lucideKeyboard,
} from '@ng-icons/lucide';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { type SearchResult, SearchService } from '../core/ai/search.service';
import { VaultService } from '../core/vault/vault.service';
import { foldForSearch } from '../features/notes/note';
import { NotesStore } from '../features/notes/notes.store';
import { TasksStore } from '../features/tasks/tasks.store';
import { Highlight } from '../shared/highlight';
import { resultLink } from '../shared/result-link';
import { ShellUi } from './shell-ui.service';

interface PaletteItem {
  id: string;
  icon: string;
  /** Translation key, or literal text for search results. */
  label: string;
  translate: boolean;
  hint?: string;
  run: () => unknown;
}

const RESULT_LIMIT = 6;

/** ⌘K quick search and navigation. */
@Component({
  selector: 'app-command-palette',
  imports: [HlmDialogImports, Highlight, NgIcon, TranslocoPipe],
  providers: [
    provideIcons({
      lucideSearch,
      lucideNotebookPen,
      lucideListTodo,
      lucideSettings,
      lucidePlus,
      lucideLock,
      lucideFileText,
      lucideSquareCheck,
      lucideArrowRight,
      lucideKeyboard,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog [state]="open() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && open.set(false)">
      <hlm-dialog-content *hlmDialogPortal="let ctx" [showCloseButton]="false" class="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <h2 class="sr-only">{{ 'palette.open' | transloco }}</h2>
        <div class="flex items-center gap-3 border-b px-4">
          <ng-icon name="lucideSearch" class="text-muted-foreground shrink-0" />
          <input
            class="placeholder:text-muted-foreground h-12 flex-1 bg-transparent text-sm outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            [attr.aria-activedescendant]="items()[active()] ? 'palette-' + items()[active()].id : null"
            [placeholder]="'palette.placeholder' | transloco"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
            (keydown)="onKeydown($event)"
          />
        </div>
        <ul id="palette-list" role="listbox" class="max-h-80 overflow-y-auto p-2" [attr.aria-label]="'palette.results' | transloco">
          <li class="text-muted-foreground px-2 pt-1 pb-2 text-xs font-medium" role="presentation">
            {{ (query().trim() ? 'palette.results' : 'palette.commands') | transloco }}
          </li>
          @for (item of items(); track item.id; let i = $index) {
            <li
              role="option"
              [id]="'palette-' + item.id"
              [attr.aria-selected]="i === active()"
              class="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm"
              [class.bg-accent]="i === active()"
              (mousemove)="active.set(i)"
              (click)="execute(item)"
            >
              <ng-icon [name]="item.icon" class="text-muted-foreground mt-0.5 shrink-0" />
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate">
                  @if (item.translate) {
                    {{ item.label | transloco }}
                  } @else {
                    <app-highlight [text]="item.label" [terms]="terms()" />
                  }
                </span>
                @if (item.hint) {
                  <span class="text-muted-foreground truncate text-xs"><app-highlight [text]="item.hint" [terms]="terms()" /></span>
                }
              </span>
            </li>
          }
        </ul>
        <div class="text-muted-foreground border-t px-4 py-2 text-xs">{{ 'palette.hint' | transloco }}</div>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class CommandPalette {
  readonly open = model(false);

  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly notes = inject(NotesStore);
  private readonly tasks = inject(TasksStore);
  private readonly vault = inject(VaultService);
  private readonly ui = inject(ShellUi);

  protected readonly query = signal('');
  protected readonly active = signal(0);
  private readonly results = signal<SearchResult[]>([]);
  protected readonly terms = computed(() => foldForSearch(this.query()).split(/\s+/).filter(Boolean));

  private readonly commands: PaletteItem[] = [
    { id: 'go-notes', icon: 'lucideNotebookPen', label: 'palette.goNotes', translate: true, run: () => this.go(['/notes']) },
    { id: 'go-tasks', icon: 'lucideListTodo', label: 'palette.goTasks', translate: true, run: () => this.go(['/tasks']) },
    { id: 'go-search', icon: 'lucideSearch', label: 'palette.goSearch', translate: true, run: () => this.go(['/search']) },
    { id: 'go-settings', icon: 'lucideSettings', label: 'palette.goSettings', translate: true, run: () => this.go(['/settings']) },
    { id: 'new-note', icon: 'lucidePlus', label: 'palette.newNote', translate: true, run: () => this.newNote() },
    { id: 'lock', icon: 'lucideLock', label: 'palette.lock', translate: true, run: () => this.vault.lock() },
    {
      id: 'shortcuts',
      icon: 'lucideKeyboard',
      label: 'shortcuts.title',
      translate: true,
      run: () => this.ui.shortcutsOpen.set(true),
    },
  ];

  protected readonly items = computed<PaletteItem[]>(() => {
    const query = this.query().trim();
    if (!query) return this.commands;
    const results = this.results().map<PaletteItem>((r) => ({
      id: `${r.doc.kind}-${r.doc.id}`,
      icon: r.doc.kind === 'note' ? 'lucideFileText' : 'lucideSquareCheck',
      label: r.doc.title || '—',
      translate: false,
      hint: r.snippet,
      run: () => {
        const link = resultLink(r.doc, (id) => this.tasks.taskById(id));
        return this.go(link.commands, link.queryParams);
      },
    }));
    return [
      ...results,
      {
        id: 'all-results',
        icon: 'lucideArrowRight',
        label: 'palette.allResults',
        translate: true,
        run: () => this.go(['/search'], { q: query }),
      },
    ];
  });

  private requestId = 0;

  constructor() {
    // Fresh state every time the palette opens.
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        this.query.set('');
        this.results.set([]);
        this.active.set(0);
      });
    });

    effect(() => {
      const query = this.query();
      this.searchService.revision();
      untracked(() => void this.search(query));
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.items().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.active.update((i) => (i + 1) % count);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.active.update((i) => (i - 1 + count) % count);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = this.items()[this.active()];
      if (item) this.execute(item);
    }
  }

  protected execute(item: PaletteItem): void {
    this.open.set(false);
    void item.run();
  }

  private async search(query: string): Promise<void> {
    const id = ++this.requestId;
    this.active.set(0);
    if (!query.trim()) {
      this.results.set([]);
      return;
    }
    const results = await this.searchService.search(query, { limit: RESULT_LIMIT });
    if (id === this.requestId) this.results.set(results);
  }

  private go(commands: string[], queryParams?: Record<string, string>): Promise<boolean> {
    return this.router.navigate(commands, { queryParams });
  }

  private async newNote(): Promise<void> {
    const note = await this.notes.create();
    await this.router.navigate(['/notes', note.id], { state: { focusTitle: true } });
  }
}
