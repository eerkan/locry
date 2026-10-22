import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArchive, lucideNotebookPen, lucidePin, lucidePlus, lucideSearch } from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { filter, map } from 'rxjs';
import { PreferencesService } from '../../core/preferences.service';
import { relativeTime } from '../../shared/relative-time';
import { type Note, matchesQuery, noteExcerpt } from './note';
import { NotesStore } from './notes.store';

type View = 'active' | 'archived';

/** Two-pane notes layout: searchable list on the left, the selected note in the outlet. */
@Component({
  selector: 'app-notes-page',
  imports: [
    RouterLink,
    RouterOutlet,
    HlmBadge,
    HlmButton,
    HlmInput,
    HlmToggleGroupImports,
    HlmTooltip,
    NgIcon,
    TranslocoPipe,
  ],
  providers: [provideIcons({ lucidePlus, lucideSearch, lucidePin, lucideArchive, lucideNotebookPen })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-[calc(100svh-3.5rem)] -m-4 md:-m-6' },
  template: `
    <aside
      class="bg-background w-full shrink-0 flex-col border-e md:w-80 lg:w-96"
      [class]="selectedId() ? 'hidden md:flex' : 'flex'"
    >
      <div class="flex flex-col gap-3 border-b p-3">
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <ng-icon name="lucideSearch" class="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2" />
            <input
              hlmInput
              type="search"
              class="w-full ps-8"
              [placeholder]="'pages.notes.search' | transloco"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
          </div>
          <button hlmBtn size="icon" [hlmTooltip]="'pages.notes.new' | transloco" [attr.aria-label]="'pages.notes.new' | transloco" (click)="createNote()">
            <ng-icon name="lucidePlus" />
          </button>
        </div>

        <div class="flex items-center justify-between gap-2">
          <hlm-toggle-group type="single" size="sm" variant="outline" [value]="view()" (valueChange)="setView($event)">
            <button hlmToggleGroupItem value="active">{{ 'pages.notes.active' | transloco }}</button>
            <button hlmToggleGroupItem value="archived">
              <ng-icon name="lucideArchive" />
              {{ 'pages.notes.archived' | transloco }}
            </button>
          </hlm-toggle-group>
          <span class="text-muted-foreground text-xs tabular-nums">{{ visibleNotes().length }}</span>
        </div>

        @if (store.allTags().length) {
          <div class="flex flex-wrap gap-1.5">
            <button
              hlmBadge
              [variant]="activeTag() ? 'outline' : 'default'"
              class="cursor-pointer"
              (click)="activeTag.set(null)"
            >
              {{ 'pages.notes.allTags' | transloco }}
            </button>
            @for (tag of store.allTags(); track tag) {
              <button
                hlmBadge
                [variant]="activeTag() === tag ? 'default' : 'outline'"
                class="cursor-pointer"
                (click)="activeTag.set(activeTag() === tag ? null : tag)"
              >
                #{{ tag }}
              </button>
            }
          </div>
        }
      </div>

      <nav class="flex-1 overflow-y-auto p-2" [attr.aria-label]="'pages.notes.title' | transloco">
        @for (note of visibleNotes(); track note.id) {
          <a
            [routerLink]="['/notes', note.id]"
            class="hover:bg-accent/60 group mb-1 flex flex-col gap-1 rounded-lg px-3 py-2.5 transition-colors"
            [class.bg-accent]="note.id === selectedId()"
            [attr.aria-current]="note.id === selectedId() ? 'page' : null"
          >
            <div class="flex items-center gap-2">
              <span class="flex-1 truncate text-sm font-medium" [class.text-muted-foreground]="!note.title">
                {{ note.title || ('pages.notes.untitled' | transloco) }}
              </span>
              @if (note.pinned) {
                <ng-icon name="lucidePin" class="text-muted-foreground shrink-0 text-xs" />
              }
            </div>
            <p class="text-muted-foreground line-clamp-2 text-xs">
              {{ excerpt(note) || ('pages.notes.noContent' | transloco) }}
            </p>
            <div class="text-muted-foreground/80 flex items-center gap-2 text-[11px]">
              <span class="shrink-0">{{ updatedLabel(note) }}</span>
              @for (tag of note.tags.slice(0, 3); track tag) {
                <span class="truncate">#{{ tag }}</span>
              }
            </div>
          </a>
        } @empty {
          <div class="text-muted-foreground flex flex-col items-center gap-3 px-6 py-12 text-center text-sm">
            @if (!store.notes().length) {
              <span class="bg-muted text-foreground flex size-12 items-center justify-center rounded-full">
                <ng-icon name="lucideNotebookPen" class="text-xl" />
              </span>
              <p class="text-foreground font-medium">{{ 'pages.notes.emptyTitle' | transloco }}</p>
              <p>{{ 'pages.notes.emptyDescription' | transloco }}</p>
              <button hlmBtn size="sm" (click)="createNote()">
                <ng-icon name="lucidePlus" />
                {{ 'pages.notes.new' | transloco }}
              </button>
            } @else if (view() === 'archived' && !query() && !activeTag()) {
              <p>{{ 'pages.notes.emptyArchive' | transloco }}</p>
            } @else {
              <p>{{ 'pages.notes.noMatch' | transloco }}</p>
            }
          </div>
        }
      </nav>
    </aside>

    <section class="min-w-0 flex-1" [class]="selectedId() ? 'block' : 'hidden md:block'">
      <router-outlet />
    </section>
  `,
})
export class NotesPage {
  protected readonly store = inject(NotesStore);
  private readonly router = inject(Router);
  private readonly prefs = inject(PreferencesService);

  protected readonly query = signal('');
  protected readonly view = signal<View>('active');
  protected readonly activeTag = signal<string | null>(null);
  /** Refreshes relative timestamps once a minute. */
  private readonly now = signal(Date.now());

  protected readonly selectedId = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.idFromUrl()),
    ),
    { initialValue: this.idFromUrl() },
  );

  protected readonly visibleNotes = computed(() => {
    const archived = this.view() === 'archived';
    const tag = this.activeTag();
    const query = this.query();
    return this.store
      .notes()
      .filter((n) => n.archived === archived && (!tag || n.tags.includes(tag)) && matchesQuery(n, query));
  });

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected setView(value: unknown): void {
    if (value === 'active' || value === 'archived') this.view.set(value);
  }

  protected async createNote(): Promise<void> {
    this.view.set('active');
    const note = await this.store.create({ tags: this.activeTag() ? [this.activeTag()!] : [] });
    await this.router.navigate(['/notes', note.id], { state: { focusTitle: true } });
  }

  protected excerpt(note: Note): string {
    return noteExcerpt(note);
  }

  protected updatedLabel(note: Note): string {
    return relativeTime(note.updatedAt, this.prefs.lang(), this.now());
  }

  private idFromUrl(): string | null {
    const match = this.router.url.match(/^\/notes\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}
