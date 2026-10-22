import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { LEGACY_DB_NAME } from './storage/locry-db';
import { VaultService } from './vault/vault.service';

export type Lang = 'tr' | 'en';
export type Theme = 'light' | 'dark' | 'system';
export type DriveAutoBackup = 'off' | 'daily' | 'weekly';

const STORAGE_KEY = 'locry.preferences';

/** Settings of the whole app on this device. */
interface Preferences {
  lang: Lang;
  theme: Theme;
  autoLockMinutes: number;
  /** OAuth client ID of the user's own Google Cloud project (public, not a secret). */
  driveClientId: string;
}

/** Settings that belong to one vault. */
interface VaultPreferences {
  /** When the last backup file was downloaded (ISO), or null. */
  lastBackupAt: string | null;
  /** How many Drive backups of this vault to keep. */
  driveKeep: number;
  driveAutoBackup: DriveAutoBackup;
  lastDriveBackupAt: string | null;
  /** Opt-in: downloads the embedding model on first use. */
  semanticSearch: boolean;
  /** Keep this vault in sync with other devices through Google Drive. */
  sync: boolean;
}

interface Stored extends Preferences {
  vaults: Record<string, VaultPreferences>;
  /** Single-vault versions kept the vault settings at the top level; they belong to the legacy vault. */
  legacy: VaultPreferences | null;
}

const VAULT_DEFAULTS: VaultPreferences = {
  lastBackupAt: null,
  driveKeep: 10,
  driveAutoBackup: 'off',
  lastDriveBackupAt: null,
  semanticSearch: false,
  sync: false,
};

/**
 * Non-sensitive UI preferences. Kept in localStorage (not the vault) because they are
 * needed on the lock screen, before the vault key is available. Vault-related settings
 * (backups, smart search) are kept per vault and follow the active vault.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly vault = inject(VaultService);
  private readonly prefs = signal<Stored>(this.load());

  private readonly vaultPrefs = computed<VaultPreferences>(() => {
    const { vaults, legacy } = this.prefs();
    const active = this.vault.activeVault();
    if (!active) return VAULT_DEFAULTS;
    return vaults[active.id] ?? (active.dbName === LEGACY_DB_NAME && legacy ? legacy : VAULT_DEFAULTS);
  });

  readonly lang = () => this.prefs().lang;
  readonly theme = () => this.prefs().theme;
  readonly autoLockMinutes = () => this.prefs().autoLockMinutes;
  readonly driveClientId = () => this.prefs().driveClientId;
  readonly lastBackupAt = () => this.vaultPrefs().lastBackupAt;
  readonly driveKeep = () => this.vaultPrefs().driveKeep;
  readonly driveAutoBackup = () => this.vaultPrefs().driveAutoBackup;
  readonly lastDriveBackupAt = () => this.vaultPrefs().lastDriveBackupAt;
  readonly semanticSearch = () => this.vaultPrefs().semanticSearch;
  readonly sync = () => this.vaultPrefs().sync;

  constructor() {
    const view = this.document.defaultView;
    const media = typeof view?.matchMedia === 'function' ? view.matchMedia('(prefers-color-scheme: dark)') : null;
    const systemDark = signal(media?.matches ?? false);
    media?.addEventListener('change', (e) => systemDark.set(e.matches));

    effect(() => {
      const theme = this.prefs().theme;
      // Prerendered pages get their theme from theme-init.js before the first paint.
      if (!this.browser) return;
      const dark = theme === 'dark' || (theme === 'system' && systemDark());
      this.document.documentElement.classList.toggle('dark', dark);
      this.document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    });
    effect(() => {
      const prefs = this.prefs();
      if (!this.browser) return;
      this.document.documentElement.lang = prefs.lang;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    });
    // Drop the settings of vaults that were deleted.
    effect(() => {
      const ids = new Set(this.vault.vaults().map((v) => v.id));
      if (this.vault.status() === 'loading') return;
      const stale = Object.keys(untracked(this.prefs).vaults).filter((id) => !ids.has(id));
      if (stale.length) {
        this.prefs.update((p) => ({
          ...p,
          vaults: Object.fromEntries(Object.entries(p.vaults).filter(([id]) => ids.has(id))),
        }));
      }
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
    this.updateVault({ lastBackupAt });
  }

  setDrive(
    patch: Partial<Pick<Preferences, 'driveClientId'> & Pick<VaultPreferences, 'driveKeep' | 'driveAutoBackup' | 'lastDriveBackupAt'>>,
  ): void {
    const { driveClientId, ...vaultPatch } = patch;
    if (driveClientId !== undefined) this.prefs.update((p) => ({ ...p, driveClientId }));
    if (Object.keys(vaultPatch).length) this.updateVault(vaultPatch);
  }

  setSemanticSearch(semanticSearch: boolean): void {
    this.updateVault({ semanticSearch });
  }

  setSync(sync: boolean): void {
    this.updateVault({ sync });
  }

  /** Changes the active vault's settings; ignored when no vault exists yet. */
  private updateVault(patch: Partial<VaultPreferences>): void {
    const id = this.vault.activeVault()?.id;
    if (!id) return;
    const current = this.vaultPrefs();
    this.prefs.update((p) => ({ ...p, vaults: { ...p.vaults, [id]: { ...current, ...patch } } }));
  }

  private load(): Stored {
    const defaults: Stored = {
      lang: !this.browser || navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en',
      theme: 'system',
      autoLockMinutes: 10,
      driveClientId: '',
      vaults: {},
      legacy: null,
    };
    if (!this.browser) return defaults;
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Stored> & Partial<VaultPreferences>;
      const vaults: Record<string, VaultPreferences> = {};
      for (const [id, value] of Object.entries(stored.vaults ?? {})) vaults[id] = parseVaultPreferences(value);
      const hasLegacy = stored.vaults === undefined && ('semanticSearch' in stored || 'driveAutoBackup' in stored || 'lastBackupAt' in stored);
      return {
        lang: stored.lang === 'tr' || stored.lang === 'en' ? stored.lang : defaults.lang,
        theme: ['light', 'dark', 'system'].includes(stored.theme as string) ? stored.theme! : defaults.theme,
        autoLockMinutes:
          typeof stored.autoLockMinutes === 'number' && stored.autoLockMinutes >= 0
            ? stored.autoLockMinutes
            : defaults.autoLockMinutes,
        driveClientId: typeof stored.driveClientId === 'string' ? stored.driveClientId : '',
        vaults,
        legacy: stored.legacy ? parseVaultPreferences(stored.legacy) : hasLegacy ? parseVaultPreferences(stored) : null,
      };
    } catch {
      return defaults;
    }
  }
}

function parseVaultPreferences(value: Partial<VaultPreferences>): VaultPreferences {
  return {
    lastBackupAt: typeof value.lastBackupAt === 'string' ? value.lastBackupAt : null,
    driveKeep: typeof value.driveKeep === 'number' && value.driveKeep >= 1 ? value.driveKeep : VAULT_DEFAULTS.driveKeep,
    driveAutoBackup: ['off', 'daily', 'weekly'].includes(value.driveAutoBackup as string)
      ? value.driveAutoBackup!
      : VAULT_DEFAULTS.driveAutoBackup,
    lastDriveBackupAt: typeof value.lastDriveBackupAt === 'string' ? value.lastDriveBackupAt : null,
    semanticSearch: value.semanticSearch === true,
    sync: value.sync === true,
  };
}
