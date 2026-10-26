import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmKbdImports } from '@spartan-ng/helm/kbd';

export interface ShortcutGroup {
  title: string;
  items: { keys: string[]; label: string }[];
}

const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'shortcuts.general',
    items: [
      { keys: [MOD, 'K'], label: 'shortcuts.palette' },
      { keys: ['/'], label: 'shortcuts.search' },
      { keys: ['N'], label: 'shortcuts.newNote' },
      { keys: ['T'], label: 'shortcuts.newTask' },
      { keys: [MOD, '\\'], label: 'shortcuts.sidebar' },
      { keys: [MOD, '⇧', 'L'], label: 'shortcuts.lock' },
      { keys: ['?'], label: 'shortcuts.help' },
    ],
  },
  {
    title: 'shortcuts.navigation',
    items: [
      { keys: ['G', 'N'], label: 'shortcuts.goNotes' },
      { keys: ['G', 'T'], label: 'shortcuts.goTasks' },
      { keys: ['G', 'A'], label: 'shortcuts.goAsk' },
      { keys: ['G', 'S'], label: 'shortcuts.goSettings' },
    ],
  },
  {
    title: 'shortcuts.editor',
    items: [
      { keys: [MOD, 'B'], label: 'pages.notes.toolbar.bold' },
      { keys: [MOD, 'I'], label: 'pages.notes.toolbar.italic' },
      { keys: [MOD, 'K'], label: 'pages.notes.toolbar.link' },
      { keys: ['Enter'], label: 'shortcuts.continueList' },
    ],
  },
];

/** Lists the keyboard shortcuts (opened with "?"). */
@Component({
  selector: 'app-shortcuts-dialog',
  imports: [HlmDialogImports, HlmKbdImports, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog [state]="open() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && open.set(false)">
      <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-lg">
        <hlm-dialog-header>
          <h2 hlmDialogTitle>{{ 'shortcuts.title' | transloco }}</h2>
        </hlm-dialog-header>
        <div class="grid gap-5 sm:grid-cols-2">
          @for (group of groups; track group.title) {
            <section class="flex flex-col gap-2" [class.sm:col-span-2]="$first">
              <h3 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{{ group.title | transloco }}</h3>
              <dl class="flex flex-col gap-1.5" [class.sm:grid]="$first" [class.sm:grid-cols-2]="$first" [class.sm:gap-x-6]="$first">
                @for (item of group.items; track item.label) {
                  <div class="flex items-center justify-between gap-3 text-sm">
                    <dt>{{ item.label | transloco }}</dt>
                    <dd class="flex gap-1">
                      @for (key of item.keys; track $index) {
                        <kbd hlmKbd>{{ key }}</kbd>
                      }
                    </dd>
                  </div>
                }
              </dl>
            </section>
          }
        </div>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class ShortcutsDialog {
  readonly open = model(false);
  protected readonly groups = SHORTCUT_GROUPS;
}
