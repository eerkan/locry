import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFileText, lucideSearch, lucideSquareCheck } from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { type SearchKind, type SearchResult, SearchService } from '../../core/ai/search.service';
import { foldForSearch } from '../notes/note';
import { TasksStore } from '../tasks/tasks.store';
import { Highlight } from '../../shared/highlight';
import { resultLink } from '../../shared/result-link';
import { SemanticStatus } from '../../shared/semantic-status';

const SEARCH_DELAY_MS = 200;

@Component({
  selector: 'app-search-page',
  imports: [HlmBadge, HlmInput, HlmToggleGroupImports, Highlight, NgIcon, RouterLink, SemanticStatus, TranslocoPipe],
  providers: [provideIcons({ lucideSearch, lucideFileText, lucideSquareCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-3xl flex-col gap-5">
      <div class="relative">
        <ng-icon name="lucideSearch" class="text-muted-foreground pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-lg" />
        <input
          #searchInput
          hlmInput
          type="search"
          class="h-12 w-full ps-10 text-base"
          [placeholder]="'pages.search.placeholder' | transloco"
          [attr.aria-label]="'pages.search.placeholder' | transloco"
          [value]="query()"
          (input)="setQuery($any($event.target).value)"
        />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <hlm-toggle-group type="single" size="sm" variant="outline" [value]="kind()" (valueChange)="setKind($event)">
          <button hlmToggleGroupItem value="all">{{ 'pages.search.all' | transloco }}</button>
          <button hlmToggleGroupItem value="note">{{ 'pages.search.notes' | transloco }}</button>
          <button hlmToggleGroupItem value="task">{{ 'pages.search.tasks' | transloco }}</button>
        </hlm-toggle-group>
        @if (query().trim() && results()) {
          <span class="text-muted-foreground text-xs">{{ 'pages.search.resultCount' | transloco: { count: results()!.length } }}</span>
        }
      </div>

      <app-semantic-status />

      @if (!query().trim()) {
        <p class="text-muted-foreground py-10 text-center text-sm">{{ 'pages.search.empty' | transloco }}</p>
      } @else if (results(); as results) {
        @if (results.length) {
          <ul class="flex flex-col gap-1" data-testid="search-results">
            @for (result of results; track result.doc.kind + result.doc.id) {
              <li>
                <a
                  class="hover:bg-accent/60 flex gap-3 rounded-lg px-3 py-3 transition-colors"
                  [routerLink]="link(result).commands"
                  [queryParams]="link(result).queryParams"
                >
                  <ng-icon
                    [name]="result.doc.kind === 'note' ? 'lucideFileText' : 'lucideSquareCheck'"
                    class="text-muted-foreground mt-0.5 shrink-0"
                    [attr.aria-label]="'pages.search.' + result.doc.kind | transloco"
                  />
                  <div class="flex min-w-0 flex-1 flex-col gap-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="truncate text-sm font-medium">
                        <app-highlight
                          [text]="result.doc.title || ((result.doc.kind === 'note' ? 'pages.notes.untitled' : 'pages.tasks.untitled') | transloco)"
                          [terms]="terms()"
                        />
                      </span>
                      @if (result.matchedBy !== 'keyword') {
                        <span hlmBadge variant="secondary" class="text-[10px]">
                          {{ (result.matchedBy === 'semantic' ? 'pages.search.matchedSemantic' : 'pages.search.matchedBoth') | transloco }}
                        </span>
                      }
                      @if (result.doc.inactive) {
                        <span hlmBadge variant="outline" class="text-[10px]">
                          {{ (result.doc.kind === 'note' ? 'pages.search.archived' : 'pages.search.done') | transloco }}
                        </span>
                      }
                    </div>
                    @if (result.snippet) {
                      <p class="text-muted-foreground line-clamp-2 text-xs">
                        <app-highlight [text]="result.snippet" [terms]="terms()" />
                      </p>
                    }
                  </div>
                </a>
              </li>
            }
          </ul>
        } @else {
          <p class="text-muted-foreground py-10 text-center text-sm">{{ 'pages.search.noResults' | transloco: { query: query() } }}</p>
        }
      }
    </div>
  `,
})
export class SearchPage {
  /** `?q=` query parameter, bound through `withComponentInputBinding`. */
  readonly q = input<string>();

  private readonly searchService = inject(SearchService);
  private readonly tasks = inject(TasksStore);
  private readonly router = inject(Router);

  protected readonly query = signal('');
  protected readonly kind = signal<SearchKind>('all');
  protected readonly results = signal<SearchResult[] | null>(null);
  protected readonly terms = computed(() => foldForSearch(this.query()).split(/\s+/).filter(Boolean));

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private requestId = 0;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    afterNextRender(() => this.searchInput()?.nativeElement.focus());

    effect(() => {
      const q = this.q() ?? '';
      untracked(() => {
        if (q !== this.query()) this.query.set(q);
      });
    });

    // Search again when the query, the filter or the index changes; ignore stale answers.
    effect(() => {
      const query = this.query();
      const kind = this.kind();
      this.searchService.revision();
      untracked(() => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => void this.run(query, kind), SEARCH_DELAY_MS);
      });
    });
  }

  protected setQuery(value: string): void {
    this.query.set(value);
    void this.router.navigate([], { queryParams: { q: value || null }, replaceUrl: true });
  }

  protected setKind(value: unknown): void {
    if (value === 'all' || value === 'note' || value === 'task') this.kind.set(value);
  }

  protected link(result: SearchResult) {
    return resultLink(result.doc, (id) => this.tasks.taskById(id));
  }

  private async run(query: string, kind: SearchKind): Promise<void> {
    const id = ++this.requestId;
    if (!query.trim()) {
      this.results.set(null);
      return;
    }
    const results = await this.searchService.search(query, { kind });
    if (id === this.requestId) this.results.set(results);
  }
}
