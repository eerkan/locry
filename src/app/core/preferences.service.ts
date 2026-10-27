import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { type ChatModelId, CHAT_MODELS, DEFAULT_CHAT_MODEL, isChatModelId } from './ai/chat-protocol';
import {
  DEFAULT_EMBEDDING_MODEL,
  EMBEDDING_MODELS,
  type EmbeddingModelId,
  LEGACY_EMBEDDING_MODEL,
  isEmbeddingModelId,
} from './ai/embedding-protocol';
import { type Lang, LANGUAGE_TAGS, detectLang, direction, isLang } from './languages';
import { LEGACY_DB_NAME } from './storage/locry-db';
import { VaultService } from './vault/vault.service';

export type { Lang } from './languages';
export type Theme = 'light' | 'dark' | 'system';
export const DRIVE_AUTO_BACKUP = ['off', '5m', '15m', '30m', 'hourly', 'daily', 'weekly'] as const;
export type DriveAutoBackup = (typeof DRIVE_AUTO_BACKUP)[number];

const STORAGE_KEY = 'locry.preferences';

/** Settings of the whole app on this device. */
interface Preferences {
  lang: Lang;
  theme: Theme;
  autoLockMinutes: number;
  /** OAuth client ID of the user's own Google Cloud project (public, not a secret). */
  driveClientId: string;
  /** "Ask your notes": opt-in, the language model is downloaded once per device. */
  askEnabled: boolean;
  askModel: ChatModelId;
  /** Task reminders as system notifications on this device (while Locry is open). */
  reminders: boolean;
  /** When tasks due on a day without a time are announced, `HH:MM`. */
  reminderTime: string;
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
  /** Model for semantic search; each device downloads and runs its own. */
  embeddingModel: EmbeddingModelId;
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
  embeddingModel: DEFAULT_EMBEDDING_MODEL,
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
  /** Which side the sidebar and drawers open on: the start of the reading direction. */
  readonly startSide = (): 'left' | 'right' => (direction(this.prefs().lang) === 'rtl' ? 'right' : 'left');
  readonly theme = () => this.prefs().theme;
  readonly autoLockMinutes = () => this.prefs().autoLockMinutes;
  readonly driveClientId = () => this.prefs().driveClientId;
  readonly askEnabled = () => this.prefs().askEnabled;
  readonly askModel = () => this.prefs().askModel;
  readonly reminders = () => this.prefs().reminders;
  readonly reminderTime = () => this.prefs().reminderTime;
  readonly lastBackupAt = () => this.vaultPrefs().lastBackupAt;
  readonly driveKeep = () => this.vaultPrefs().driveKeep;
  readonly driveAutoBackup = () => this.vaultPrefs().driveAutoBackup;
  readonly lastDriveBackupAt = () => this.vaultPrefs().lastDriveBackupAt;
  readonly semanticSearch = () => this.vaultPrefs().semanticSearch;
  readonly sync = () => this.vaultPrefs().sync;
  readonly embeddingModel = () => this.vaultPrefs().embeddingModel;

  /** Models used by any vault on this device with semantic search on (their files stay cached). */
  readonly embeddingModelsInUse = computed(() => {
    const { vaults, legacy } = this.prefs();
    const all = [...Object.values(vaults), ...(legacy ? [legacy] : [])];
    return new Set(all.filter((v) => v.semanticSearch).map((v) => v.embeddingModel));
  });

  /** Hugging Face repositories whose downloaded files must stay: embedding and language models in use. */
  readonly modelReposInUse = computed(() => [
    ...[...this.embeddingModelsInUse()].map((id) => EMBEDDING_MODELS[id].repo),
    ...(this.prefs().askEnabled ? [CHAT_MODELS[this.prefs().askModel].repo] : []),
  ]);

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
      this.applyDocumentLanguage();
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

  /** Puts the interface language and direction on <html>; landing pages set their own while open. */
  applyDocumentLanguage(): void {
    if (!this.browser) return;
    const lang = untracked(() => this.prefs().lang);
    this.document.documentElement.lang = LANGUAGE_TAGS[lang];
    this.document.documentElement.dir = direction(lang);
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

  setAsk(patch: Partial<Pick<Preferences, 'askEnabled' | 'askModel'>>): void {
    this.prefs.update((p) => ({ ...p, ...patch }));
  }

  setReminders(patch: Partial<Pick<Preferences, 'reminders' | 'reminderTime'>>): void {
    this.prefs.update((p) => ({ ...p, ...patch }));
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

  setEmbeddingModel(embeddingModel: EmbeddingModelId): void {
    this.updateVault({ embeddingModel });
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
      lang: this.browser ? detectLang(navigator.languages?.length ? navigator.languages : [navigator.language]) : 'en',
      theme: 'system',
      autoLockMinutes: 10,
      driveClientId: '',
      askEnabled: false,
      askModel: DEFAULT_CHAT_MODEL,
      reminders: false,
      reminderTime: '09:00',
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
        lang: isLang(stored.lang) ? stored.lang : defaults.lang,
        theme: ['light', 'dark', 'system'].includes(stored.theme as string) ? stored.theme! : defaults.theme,
        autoLockMinutes:
          typeof stored.autoLockMinutes === 'number' && stored.autoLockMinutes >= 0
            ? stored.autoLockMinutes
            : defaults.autoLockMinutes,
        driveClientId: typeof stored.driveClientId === 'string' ? stored.driveClientId : '',
        askEnabled: stored.askEnabled === true,
        askModel: isChatModelId(stored.askModel) ? stored.askModel : defaults.askModel,
        reminders: stored.reminders === true,
        reminderTime: typeof stored.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(stored.reminderTime) ? stored.reminderTime : defaults.reminderTime,
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
    driveAutoBackup: (DRIVE_AUTO_BACKUP as readonly string[]).includes(value.driveAutoBackup as string)
      ? value.driveAutoBackup!
      : VAULT_DEFAULTS.driveAutoBackup,
    lastDriveBackupAt: typeof value.lastDriveBackupAt === 'string' ? value.lastDriveBackupAt : null,
    semanticSearch: value.semanticSearch === true,
    sync: value.sync === true,
    // Vaults that turned smart search on before models were selectable keep their model,
    // so nothing is downloaded or re-indexed without asking.
    embeddingModel: isEmbeddingModelId(value.embeddingModel)
      ? value.embeddingModel
      : value.semanticSearch === true
        ? LEGACY_EMBEDDING_MODEL
        : DEFAULT_EMBEDDING_MODEL,
  };
}
