import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

export type Lang = 'tr' | 'en';
export type Theme = 'light' | 'dark' | 'system';
export type DriveAutoBackup = 'off' | 'daily' | 'weekly';

const STORAGE_KEY = 'locry.preferences';

interface Preferences {
  lang: Lang;
  theme: Theme;
  autoLockMinutes: number;
  /** When the last backup file was downloaded (ISO), or null. */
  lastBackupAt: string | null;
  /** OAuth client ID of the user's own Google Cloud project (public, not a secret). */
  driveClientId: string;
  /** How many Drive backups of this vault to keep. */
  driveKeep: number;
  driveAutoBackup: DriveAutoBackup;
  lastDriveBackupAt: string | null;
  /** Opt-in: downloads the embedding model on first use. */
  semanticSearch: boolean;
}

/**
 * Non-sensitive UI preferences. Kept in localStorage (not the vault) because they are
 * needed on the lock screen, before the vault key is available.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly prefs = signal<Preferences>(this.load());

  readonly lang = () => this.prefs().lang;
  readonly theme = () => this.prefs().theme;
  readonly autoLockMinutes = () => this.prefs().autoLockMinutes;
  readonly lastBackupAt = () => this.prefs().lastBackupAt;
  readonly driveClientId = () => this.prefs().driveClientId;
  readonly driveKeep = () => this.prefs().driveKeep;
  readonly driveAutoBackup = () => this.prefs().driveAutoBackup;
  readonly lastDriveBackupAt = () => this.prefs().lastDriveBackupAt;
  readonly semanticSearch = () => this.prefs().semanticSearch;

  constructor() {
    const view = this.document.defaultView;
    const media = typeof view?.matchMedia === 'function' ? view.matchMedia('(prefers-color-scheme: dark)') : null;
    const systemDark = signal(media?.matches ?? false);
    media?.addEventListener('change', (e) => systemDark.set(e.matches));

    effect(() => {
      const theme = this.prefs().theme;
      const dark = theme === 'dark' || (theme === 'system' && systemDark());
      this.document.documentElement.classList.toggle('dark', dark);
      this.document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    });
    effect(() => {
      this.document.documentElement.lang = this.prefs().lang;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs()));
    });
  }

  setLang(lang: Lang): void {
    this.prefs.update((p) => ({ ...p, lang }));
  }

  setTheme(theme: Theme): void {
    this.prefs.update((p) => ({ ...p, theme }));
  }

  setAutoLockMinutes(autoLockMinutes: number): void {
    this.prefs.update((p) => ({ ...p, autoLockMinutes }));
  }

  setLastBackupAt(lastBackupAt: string): void {
    this.prefs.update((p) => ({ ...p, lastBackupAt }));
  }

  setDrive(patch: Partial<Pick<Preferences, 'driveClientId' | 'driveKeep' | 'driveAutoBackup' | 'lastDriveBackupAt'>>): void {
    this.prefs.update((p) => ({ ...p, ...patch }));
  }

  setSemanticSearch(semanticSearch: boolean): void {
    this.prefs.update((p) => ({ ...p, semanticSearch }));
  }

  private load(): Preferences {
    const defaults: Preferences = {
      lang: navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en',
      theme: 'system',
      autoLockMinutes: 10,
      lastBackupAt: null,
      driveClientId: '',
      driveKeep: 10,
      driveAutoBackup: 'off',
      lastDriveBackupAt: null,
      semanticSearch: false,
    };
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Preferences>;
      return {
        lang: stored.lang === 'tr' || stored.lang === 'en' ? stored.lang : defaults.lang,
        theme: ['light', 'dark', 'system'].includes(stored.theme as string) ? stored.theme! : defaults.theme,
        autoLockMinutes:
          typeof stored.autoLockMinutes === 'number' && stored.autoLockMinutes >= 0
            ? stored.autoLockMinutes
            : defaults.autoLockMinutes,
        lastBackupAt: typeof stored.lastBackupAt === 'string' ? stored.lastBackupAt : null,
        driveClientId: typeof stored.driveClientId === 'string' ? stored.driveClientId : '',
        driveKeep:
          typeof stored.driveKeep === 'number' && stored.driveKeep >= 1 ? stored.driveKeep : defaults.driveKeep,
        driveAutoBackup: ['off', 'daily', 'weekly'].includes(stored.driveAutoBackup as string)
          ? stored.driveAutoBackup!
          : defaults.driveAutoBackup,
        lastDriveBackupAt: typeof stored.lastDriveBackupAt === 'string' ? stored.lastDriveBackupAt : null,
        semanticSearch: stored.semanticSearch === true,
      };
    } catch {
      return defaults;
    }
  }
}
