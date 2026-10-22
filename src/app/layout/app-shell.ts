import { ChangeDetectionStrategy, Component, DOCUMENT, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronsUpDown,
  lucideFileUp,
  lucideListTodo,
  lucideLock,
  lucideNotebookPen,
  lucidePlus,
  lucideSearch,
  lucideSettings,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmKbdImports } from '@spartan-ng/helm/kbd';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmSidebarImports, HlmSidebarService, provideHlmSidebarConfig } from '@spartan-ng/helm/sidebar';
import { filter, map } from 'rxjs';
import { errorKey } from '../core/i18n';
import { VaultService } from '../core/vault/vault.service';
import { TasksStore } from '../features/tasks/tasks.store';
import { Logo } from '../shared/logo';
import { AutoDriveBackupService } from '../core/drive/auto-drive-backup.service';
import { StorageHealthService } from '../core/storage/storage-health.service';
import { NotesStore } from '../features/notes/notes.store';
import { CommandPalette } from './command-palette';
import { ShellUi } from './shell-ui.service';
import { ShortcutsDialog } from './shortcuts';
import { PreferencesMenu } from '../shared/preferences-menu';
import { VaultLabel } from '../shared/vault-ui';
import { SyncStatusLabel, announceSync, syncStatusLabel } from '../shared/sync-status';
import { SyncService } from '../core/sync/sync.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

/** Main layout once the vault is unlocked: sidebar navigation plus the page outlet. */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    HlmSidebarImports,
    HlmSeparator,
    NgIcon,
    TranslocoPipe,
    CommandPalette,
    ShortcutsDialog,
    HlmKbdImports,
    Logo,
    PreferencesMenu,
    HlmDropdownMenuImports,
    VaultLabel,
    SyncStatusLabel,
  ],
  providers: [
    provideIcons({
      lucideNotebookPen,
      lucideListTodo,
      lucideSearch,
      lucideSettings,
      lucideLock,
      lucideChevronsUpDown,
      lucidePlus,
      lucideFileUp,
    }),
    // A shell-level sidebar service so it sees this config (and stays out of the initial
    // bundle). ⌘B means bold in the editor, so the sidebar toggles with ⌘\\ (as in Notion).
    HlmSidebarService,
    provideHlmSidebarConfig({ sidebarKeyboardShortcut: '\\' }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onShortcut($event)' },
  template: `
    <div hlmSidebarWrapper>
      <hlm-sidebar collapsible="icon">
        <hlm-sidebar-header class="px-3 py-3">
          <app-logo class="group-data-[collapsible=icon]:[&>span:last-child]:hidden" />
          @if (vault.activeVault(); as active) {
            <ul hlmSidebarMenu class="mt-2">
              <li hlmSidebarMenuItem>
                <button
                  hlmSidebarMenuButton
                  class="border"
                  [hlmDropdownMenuTrigger]="vaultMenu"
                  align="start"
                  [tooltip]="'vaults.switch' | transloco"
                  [attr.aria-label]="'vaults.switch' | transloco"
                >
                  <app-vault-label [vault]="active" class="flex-1 group-data-[collapsible=icon]:[&>span:last-child]:hidden" />
                  <ng-icon name="lucideChevronsUpDown" class="text-muted-foreground" />
                </button>
              </li>
            </ul>
          }
        </hlm-sidebar-header>

        <ng-template #vaultMenu>
          <hlm-dropdown-menu class="w-56">
            <hlm-dropdown-menu-label>{{ 'vaults.title' | transloco }}</hlm-dropdown-menu-label>
            <hlm-dropdown-menu-group>
              @for (v of vault.vaults(); track v.id) {
                <button
                  hlmDropdownMenuRadio
                  [checked]="v.id === vault.activeVault()?.id"
                  (triggered)="switchVault(v.id)"
                >
                  <hlm-dropdown-menu-radio-indicator />
                  <app-vault-label [vault]="v" />
                </button>
              }
            </hlm-dropdown-menu-group>
            <hlm-dropdown-menu-separator />
            <hlm-dropdown-menu-group>
              <button hlmDropdownMenuItem (triggered)="vault.lock('/setup')">
                <ng-icon name="lucidePlus" />
                {{ 'vaults.newVault' | transloco }}
              </button>
              <button hlmDropdownMenuItem (triggered)="vault.lock('/restore')">
                <ng-icon name="lucideFileUp" />
                {{ 'vaults.addFromBackup' | transloco }}
              </button>
              <a hlmDropdownMenuItem routerLink="/settings" fragment="vault">
                <ng-icon name="lucideSettings" />
                {{ 'vaults.manage' | transloco }}
              </a>
            </hlm-dropdown-menu-group>
          </hlm-dropdown-menu>
        </ng-template>

        <hlm-sidebar-content>
          <hlm-sidebar-group>
            <div hlmSidebarGroupLabel>{{ 'nav.workspace' | transloco }}</div>
            <div hlmSidebarGroupContent>
              <ul hlmSidebarMenu>
                @for (item of mainNav; track item.path) {
                  <li hlmSidebarMenuItem>
                    <a
                      hlmSidebarMenuButton
                      [routerLink]="item.path"
                      routerLinkActive
                      #rla="routerLinkActive"
                      [isActive]="rla.isActive"
                      [tooltip]="item.label | transloco"
                    >
                      <ng-icon [name]="item.icon" />
                      <span>{{ item.label | transloco }}</span>
                    </a>
                    @if (item.path === '/tasks' && todayCount()) {
                      <hlm-sidebar-menu-badge>{{ todayCount() }}</hlm-sidebar-menu-badge>
                    }
                  </li>
                }
              </ul>
            </div>
          </hlm-sidebar-group>
        </hlm-sidebar-content>

        <hlm-sidebar-footer>
          <ul hlmSidebarMenu>
            @if (sync.status() !== 'off') {
              <li hlmSidebarMenuItem>
                <button
                  hlmSidebarMenuButton
                  [disabled]="sync.status() === 'syncing'"
                  [tooltip]="statusLabel() | transloco"
                  (click)="syncNow()"
                >
                  <app-sync-status-label class="group-data-[collapsible=icon]:[&>span]:hidden" />
                </button>
              </li>
            }
            <li hlmSidebarMenuItem>
              <a
                hlmSidebarMenuButton
                routerLink="/settings"
                routerLinkActive
                #settingsRla="routerLinkActive"
                [isActive]="settingsRla.isActive"
                [tooltip]="'nav.settings' | transloco"
              >
                <ng-icon name="lucideSettings" />
                <span>{{ 'nav.settings' | transloco }}</span>
              </a>
            </li>
            <li hlmSidebarMenuItem>
              <button hlmSidebarMenuButton (click)="vault.lock()" [tooltip]="'nav.lock' | transloco">
                <ng-icon name="lucideLock" />
                <span>{{ 'nav.lock' | transloco }}</span>
              </button>
            </li>
          </ul>
        </hlm-sidebar-footer>
        <button hlmSidebarRail></button>
      </hlm-sidebar>

      <main hlmSidebarInset>
        <header class="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
          <button hlmSidebarTrigger></button>
          <hlm-separator orientation="vertical" class="mx-1 h-4 data-vertical:self-center" />
          <h1 class="text-sm font-medium">{{ title() | transloco }}</h1>
          <div class="ms-auto flex items-center gap-2">
            <button
              type="button"
              class="text-muted-foreground hover:bg-accent hover:text-foreground hidden h-8 items-center gap-2 rounded-md border px-2.5 text-xs transition-colors sm:flex"
              (click)="ui.paletteOpen.set(true)"
            >
              <ng-icon name="lucideSearch" />
              <span>{{ 'palette.placeholder' | transloco }}</span>
              <kbd hlmKbd>{{ isMac ? '⌘' : 'Ctrl' }} K</kbd>
            </button>
            <app-preferences-menu />
          </div>
        </header>
        <div class="flex-1 p-4 md:p-6">
          <router-outlet />
        </div>
      </main>
    </div>

    <app-command-palette [(open)]="ui.paletteOpen" />
    <app-shortcuts-dialog [(open)]="ui.shortcutsOpen" />
  `,
})
export class AppShell {
  protected readonly vault = inject(VaultService);
  protected readonly ui = inject(ShellUi);
  private readonly notes = inject(NotesStore);
  private pendingG?: ReturnType<typeof setTimeout>;
  protected readonly isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  /** Open tasks due today or overdue, shown as a badge on the Tasks item. */
  private readonly tasks = inject(TasksStore);
  protected readonly todayCount = computed(() => this.tasks.counts().today);

  protected readonly mainNav: NavItem[] = [
    { path: '/notes', label: 'nav.notes', icon: 'lucideNotebookPen' },
    { path: '/tasks', label: 'nav.tasks', icon: 'lucideListTodo' },
    { path: '/search', label: 'nav.search', icon: 'lucideSearch' },
  ];

  protected readonly title = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.titleFor(this.router.url)),
    ),
    { initialValue: this.titleFor(this.router.url) },
  );

  protected readonly sync = inject(SyncService);
  protected readonly statusLabel = computed(() => syncStatusLabel(this.sync.status()));
  private readonly transloco = inject(TranslocoService);

  constructor() {
    // Unlocked-only background services, kept out of the initial bundle.
    inject(AutoDriveBackupService);
    inject(StorageHealthService);

    // On phones the sidebar is an overlay: close it once a page was chosen.
    const sidebar = inject(HlmSidebarService);
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => sidebar.setOpenMobile(false));
  }

  /** From a click, so Google may show its popup when a new token is needed. */
  protected async syncNow(): Promise<void> {
    try {
      announceSync(await this.sync.syncNow({ interactive: true }), this.transloco, 'sync.done');
    } catch (error) {
      console.error(error);
      toast.error(this.transloco.translate(errorKey(error)));
    }
  }

  /** Locks the open vault and shows the lock screen of the chosen one. */
  protected switchVault(vaultId: string): void {
    if (vaultId === this.vault.activeVault()?.id) return;
    void this.vault.select(vaultId).catch((error) => console.error(error));
  }

  /**
   * Global shortcuts. Modifier shortcuts work everywhere; single keys only when no text
   * field has focus and no dialog is open. "G" starts a two-key navigation sequence.
   */
  protected onShortcut(event: KeyboardEvent): void {
    // The note editor uses ⌘K/⌘B/⌘I itself and marks those events as handled.
    if (event.defaultPrevented || event.isComposing) return;
    const mod = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();

    if (mod && !event.altKey && !event.shiftKey && key === 'k') {
      event.preventDefault();
      this.ui.paletteOpen.update((open) => !open);
      return;
    }
    if (mod && event.shiftKey && key === 'l') {
      event.preventDefault();
      this.vault.lock();
      return;
    }
    if (mod || event.altKey || isEditable(event.target) || this.document.querySelector('[role="dialog"], [role="alertdialog"]')) {
      return;
    }

    if (this.pendingG) {
      clearTimeout(this.pendingG);
      this.pendingG = undefined;
      const target = { n: '/notes', t: '/tasks', s: '/settings' }[key];
      if (target) {
        event.preventDefault();
        void this.router.navigateByUrl(target);
      }
      return;
    }

    switch (event.key) {
      case 'g':
      case 'G':
        this.pendingG = setTimeout(() => (this.pendingG = undefined), 1000);
        break;
      case '/':
        event.preventDefault();
        void this.router.navigateByUrl('/search');
        break;
      case 'n':
      case 'N':
        event.preventDefault();
        void this.newNote();
        break;
      case 't':
      case 'T':
        event.preventDefault();
        void this.router.navigate(['/tasks', 'inbox']).then(() => this.ui.quickAddRequests.update((n) => n + 1));
        break;
      case '?':
        event.preventDefault();
        this.ui.shortcutsOpen.set(true);
        break;
    }
  }

  private async newNote(): Promise<void> {
    const note = await this.notes.create();
    await this.router.navigate(['/notes', note.id], { state: { focusTitle: true } });
  }

  private titleFor(url: string): string {
    const section = url.split(/[/?#]/)[1] || 'notes';
    return `nav.${section}`;
  }
}

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}
