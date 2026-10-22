import { Injectable, signal } from '@angular/core';

/** Open/closed state of the shell's global dialogs, shared by shortcuts and the palette. */
@Injectable({ providedIn: 'root' })
export class ShellUi {
  readonly paletteOpen = signal(false);
  readonly shortcutsOpen = signal(false);
  /** Incremented to ask the tasks page to focus its quick-add field (works when already there). */
  readonly quickAddRequests = signal(0);
}
