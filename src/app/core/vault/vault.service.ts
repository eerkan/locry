import { Injectable, computed, inject, signal } from '@angular/core';
import { importAesKey } from '../crypto/aead';
import { wipe } from '../crypto/bytes';
import { formatRecoveryKey, generateRecoveryKey, parseRecoveryKey } from '../crypto/recovery-key';
import { LocryDb } from '../storage/locry-db';
import { PasskeyClient, currentRpId } from './passkey';
import { type VaultColor, type VaultProfile, VaultRegistry, vaultDbName } from './vault-registry';
import { mergeHeaders } from '../sync/merge';
import {
  VAULT_FORMAT_VERSION,
  type VaultHeader,
  createCheck,
  createKeySlot,
  generateVaultKey,
  isVaultHeader,
  newPrfSalt,
  newVaultId,
  passkeySlotsFor,
  passkeyKek,
  recoveryKek,
  unwrapVaultKey,
  unwrapVaultKeyRaw,
  verifyVaultKey,
} from './vault-header';

/** localStorage key of the vault shown on the lock screen at startup. */
const ACTIVE_VAULT_KEY = 'locry.active-vault';

export type VaultStatus = 'loading' | 'empty' | 'locked' | 'unlocked';

/** Error codes surfaced to the UI (translated under `errors.vault.*`). */
export type VaultErrorCode =
  | 'invalidRecoveryKey'
  | 'wrongRecoveryKey'
  | 'unknownPasskey'
  | 'corrupted'
  | 'locked'
  | 'lastPasskey'
  /** The vault has passkeys, but none for this site (e.g. restored from localhost onto a domain). */
  | 'noPasskeyForSite'
  /** A vault with this id already exists on this device. */
  | 'vaultExists';

export class VaultError extends Error {
  constructor(
    readonly code: VaultErrorCode,
    cause?: unknown,
  ) {
    super(`Vault error: ${code}`, { cause });
  }
}

/** A vault created in memory but not yet persisted: the user still has to save the recovery key. */
export interface PendingVault {
  header: VaultHeader;
  name: string;
  color: VaultColor;
  key: CryptoKey;
  recoveryKey: string;
}

/** A header change waiting for the user to confirm a new recovery key. */
export interface PendingRecoveryKey {
  header: VaultHeader;
  recoveryKey: string;
}

/**
 * Proof of possession used before changing key slots: the vault key is non-extractable,
 * so adding a slot requires unwrapping it again from an existing one.
 */
export type ReAuth = { method: 'passkey' } | { method: 'recovery'; recoveryKey: string };

@Injectable({ providedIn: 'root' })
export class VaultService {
  private readonly db = inject(LocryDb);
  private readonly passkeys = inject(PasskeyClient);
  private readonly registry = inject(VaultRegistry);

  private readonly _status = signal<VaultStatus>('loading');
  private readonly _header = signal<VaultHeader | null>(null);
  private readonly _lockCount = signal(0);
  private readonly _vaults = signal<VaultProfile[]>([]);
  private readonly _activeId = signal<string | null>(null);
  private key: CryptoKey | null = null;
  private lockDestination: string | null = null;
  private initPromise?: Promise<void>;

  readonly status = this._status.asReadonly();
  readonly header = this._header.asReadonly();
  readonly isUnlocked = computed(() => this._status() === 'unlocked');
  /** Increments every time an unlocked vault locks; lets others react to locking reliably. */
  readonly lockCount = this._lockCount.asReadonly();
  /** Every vault on this device, in the order they were added. */
  readonly vaults = this._vaults.asReadonly();
  /** The vault shown on the lock screen, or open. Changes only through {@link select}. */
  readonly activeVault = computed(() => this._vaults().find((v) => v.id === this._activeId()) ?? null);
  readonly passkeySlots = computed(() => this._header()?.keySlots.filter((s) => s.kind === 'passkey') ?? []);
  /** This page's site; passkeys only work on the site they were created for. */
  readonly rpId = currentRpId();
  /** Passkeys that can unlock the vault on this site. */
  readonly localPasskeySlots = computed(() => {
    const header = this._header();
    return header ? passkeySlotsFor(header, this.rpId) : [];
  });

  /** Loads the vault list and the last used vault's header. Safe to call repeatedly. */
  init(): Promise<void> {
    this.initPromise ??= (async () => {
      await this.registerLegacyVault();
      const vaults = await this.registry.list();
      this._vaults.set(vaults);
      const preferred = vaults.find((v) => v.id === readActiveVaultId()) ?? vaults[0];
      if (preferred) await this.load(preferred);
      else this.setEmpty();
    })();
    return this.initPromise;
  }

  /**
   * Makes another vault the active one. An open vault is locked first; the lock screen then
   * shows the selected vault.
   */
  async select(vaultId: string): Promise<void> {
    const profile = this._vaults().find((v) => v.id === vaultId);
    if (!profile) throw new VaultError('corrupted');
    if (profile.id === this._activeId() && this._status() !== 'unlocked') return;
    if (this._status() === 'unlocked') this.lock('/unlock');
    await this.load(profile);
  }

  /** Renames or recolors a vault (the name is visible on the lock screen). */
  async updateProfile(
    vaultId: string,
    patch: Partial<Pick<VaultProfile, 'name' | 'color' | 'updatedAt'>>,
  ): Promise<void> {
    const profile = this._vaults().find((v) => v.id === vaultId);
    if (!profile) throw new VaultError('corrupted');
    const next: VaultProfile = {
      ...profile,
      ...patch,
      name: (patch.name ?? profile.name).trim().slice(0, 60),
      updatedAt: patch.updatedAt ?? new Date().toISOString(),
    };
    await this.registry.put(next);
    this._vaults.update((list) => list.map((v) => (v.id === vaultId ? next : v)));
  }

  /**
   * Deletes the open vault and all its data from this device, after proving possession again.
   * Backups (files, Drive) are not touched. Another vault becomes active, if there is one.
   */
  async deleteVault(auth: ReAuth): Promise<void> {
    const header = this.requireUnlockedHeader();
    wipe(await this.rawKeyFor(header, auth));
    const profile = this.activeVault()!;
    // Locked from here on, so nothing reads the vault while its database goes away.
    this.key = null;
    this._status.set('locked');
    await this.db.deleteDatabase(profile.dbName);
    await this.registry.delete(profile.id);
    const remaining = this._vaults().filter((v) => v.id !== profile.id);
    this._vaults.set(remaining);
    if (remaining.length) await this.load(remaining[0]);
    else this.setEmpty();
    this.lockDestination = '/';
    this._lockCount.update((n) => n + 1);
  }

  /**
   * Where the app should go after the latest lock, when it was locked on purpose (switching
   * or deleting vaults) rather than by the user or auto-lock. Read once.
   */
  consumeLockDestination(): string | null {
    const destination = this.lockDestination;
    this.lockDestination = null;
    return destination;
  }

  // ---- Setup -----------------------------------------------------------------------------

  /**
   * Step 1 of setup: registers a passkey and builds the vault in memory, with a passkey slot
   * and a recovery slot. Nothing is written until {@link completeSetup}.
   */
  async prepareVault(
    passkeyLabel: string,
    profile: { name?: string; color?: VaultColor } = {},
  ): Promise<PendingVault> {
    const vaultId = newVaultId();
    const prfSalt = newPrfSalt();
    const name = profile.name?.trim() ?? '';
    const account = passkeyAccountName(name);
    const registration = await this.passkeys.register({ userName: account, displayName: account, prfSalt });

    const vaultKey = await generateVaultKey();
    const recoveryKey = generateRecoveryKey();
    try {
      const passkeySlot = await createKeySlot(vaultId, vaultKey.raw, await passkeyKek(registration.prfOutput, vaultId), {
        kind: 'passkey',
        credentialId: registration.credentialId,
        rpId: registration.rpId,
        label: passkeyLabel,
      });
      const recoverySlot = await createKeySlot(vaultId, vaultKey.raw, await recoveryKek(recoveryKey, vaultId), {
        kind: 'recovery',
        label: 'recovery',
      });

      const header: VaultHeader = {
        version: VAULT_FORMAT_VERSION,
        vaultId,
        prfSalt,
        createdAt: new Date().toISOString(),
        keySlots: [passkeySlot, recoverySlot],
        check: await createCheck(vaultId, vaultKey.key),
      };
      return {
        header,
        name,
        color: profile.color ?? 'blue',
        key: vaultKey.key,
        recoveryKey: formatRecoveryKey(recoveryKey),
      };
    } finally {
      wipe(vaultKey.raw);
      wipe(recoveryKey);
      wipe(registration.prfOutput);
    }
  }

  /** Step 2 of setup: persists the vault once the user confirmed the recovery key, and unlocks it. */
  async completeSetup(pending: PendingVault): Promise<void> {
    await this.addVault(pending.header, { name: pending.name, color: pending.color });
    this.setUnlocked(pending.key);
  }

  /** Adds a vault from a backup as a new vault on this device and unlocks it. */
  async adoptVault(
    header: VaultHeader,
    key: CryptoKey,
    profile: { name: string; color: VaultColor; updatedAt?: string },
  ): Promise<void> {
    if (this.hasVault(header.vaultId)) throw new VaultError('vaultExists');
    if (!(await verifyVaultKey(header, key))) throw new VaultError('corrupted');
    await this.addVault(header, profile);
    this.setUnlocked(key);
  }

  /** Whether a vault with this id is on this device. */
  hasVault(vaultId: string): boolean {
    return this._vaults().some((v) => v.id === vaultId);
  }

  /**
   * Opens a vault of this device with a key obtained elsewhere (e.g. from a backup of the
   * same vault). The key is checked against the local header first.
   */
  async unlockWithKey(vaultId: string, key: CryptoKey): Promise<void> {
    await this.select(vaultId);
    if (!(await verifyVaultKey(this.requireHeader(), key))) throw new VaultError('corrupted');
    this.setUnlocked(key);
  }

  // ---- Unlock ----------------------------------------------------------------------------

  async unlockWithPasskey(): Promise<void> {
    this.setUnlocked(await this.openWithPasskey(this.requireHeader()));
  }

  async unlockWithRecoveryKey(input: string): Promise<void> {
    this.setUnlocked(await this.openWithRecoveryKey(this.requireHeader(), input));
  }

  /** Unwraps the vault key of any header (this vault's or a backup's) with a passkey. */
  async openWithPasskey(header: VaultHeader): Promise<CryptoKey> {
    const raw = await this.rawKeyWithPasskey(header);
    try {
      return await importAesKey(raw);
    } finally {
      wipe(raw);
    }
  }

  /** Unwraps the vault key of any header (this vault's or a backup's) with a recovery key. */
  async openWithRecoveryKey(header: VaultHeader, input: string): Promise<CryptoKey> {
    const recoveryKey = parseRecoveryKey(input);
    if (!recoveryKey) throw new VaultError('invalidRecoveryKey');
    try {
      const slot = header.keySlots.find((s) => s.kind === 'recovery');
      if (!slot) throw new VaultError('corrupted');
      return await this.unwrap(() =>
        recoveryKek(recoveryKey, header.vaultId).then((kek) => unwrapVaultKey(header, slot, kek)),
        'wrongRecoveryKey',
      );
    } finally {
      wipe(recoveryKey);
    }
  }

  /**
   * Locks the vault. `destination` overrides where the app goes afterwards (default: the
   * lock screen, returning to the current page after unlocking).
   */
  lock(destination?: string): void {
    this.key = null;
    if (this._status() !== 'unlocked') return;
    this.lockDestination = destination ?? null;
    this._status.set('locked');
    this._lockCount.update((n) => n + 1);
  }

  /** The vault key, for the encrypted store. Throws when locked. */
  requireKey(): CryptoKey {
    if (!this.key) throw new VaultError('locked');
    return this.key;
  }

  // ---- Key slot management ---------------------------------------------------------------

  /** Registers another passkey and adds a slot for it. */
  async addPasskey(label: string, auth: ReAuth): Promise<void> {
    const header = this.requireUnlockedHeader();
    const raw = await this.rawKeyFor(header, auth);
    try {
      // Only this site's passkeys can live on this authenticator for this site.
      const existing = passkeySlotsFor(header, this.rpId).map((s) => s.credentialId!);
      const account = passkeyAccountName(this.activeVault()?.name ?? '');
      const registration = await this.passkeys.register({
        userName: account,
        displayName: account,
        prfSalt: header.prfSalt,
        excludeCredentialIds: existing,
      });
      try {
        const slot = await createKeySlot(header.vaultId, raw, await passkeyKek(registration.prfOutput, header.vaultId), {
          kind: 'passkey',
          credentialId: registration.credentialId,
          rpId: registration.rpId,
          label,
        });
        await this.saveHeader({ ...header, keySlots: [...header.keySlots, slot] });
      } finally {
        wipe(registration.prfOutput);
      }
    } finally {
      wipe(raw);
    }
  }

  async renamePasskey(slotId: string, label: string): Promise<void> {
    const header = this.requireUnlockedHeader();
    await this.saveHeader({
      ...header,
      keySlots: header.keySlots.map((s) => (s.id === slotId && s.kind === 'passkey' ? { ...s, label } : s)),
    });
  }

  /**
   * Removes a passkey slot. The passkey itself stays in the password manager but can no
   * longer open this vault (older backups keep their own copy of the slots).
   */
  async removePasskey(slotId: string): Promise<void> {
    const header = this.requireUnlockedHeader();
    if (this.passkeySlots().length <= 1) throw new VaultError('lastPasskey');
    await this.saveHeader({
      ...header,
      keySlots: header.keySlots.filter((s) => s.id !== slotId),
      removedSlotIds: [...(header.removedSlotIds ?? []), slotId],
    });
  }

  /**
   * Creates a new recovery key in memory. The old one keeps working until
   * {@link commitRecoveryKey} is called with the result.
   */
  async prepareRecoveryKey(auth: ReAuth): Promise<PendingRecoveryKey> {
    const header = this.requireUnlockedHeader();
    const raw = await this.rawKeyFor(header, auth);
    const recoveryKey = generateRecoveryKey();
    try {
      const slot = await createKeySlot(header.vaultId, raw, await recoveryKek(recoveryKey, header.vaultId), {
        kind: 'recovery',
        label: 'recovery',
      });
      return {
        header: { ...header, keySlots: [...header.keySlots.filter((s) => s.kind !== 'recovery'), slot] },
        recoveryKey: formatRecoveryKey(recoveryKey),
      };
    } finally {
      wipe(raw);
      wipe(recoveryKey);
    }
  }

  async commitRecoveryKey(pending: PendingRecoveryKey): Promise<void> {
    const current = this.requireUnlockedHeader();
    if (current.vaultId !== pending.header.vaultId) throw new VaultError('corrupted');
    // Keep passkey changes made meanwhile; only the recovery slot is replaced.
    const recovery = pending.header.keySlots.find((s) => s.kind === 'recovery')!;
    const replaced = current.keySlots.filter((s) => s.kind === 'recovery').map((s) => s.id);
    await this.saveHeader({
      ...current,
      keySlots: [...current.keySlots.filter((s) => s.kind !== 'recovery'), recovery],
      removedSlotIds: [...(current.removedSlotIds ?? []), ...replaced],
    });
  }

  /**
   * Takes key slot changes from another device's copy of this vault's header (a passkey
   * added on the phone, a recovery key replaced on the laptop). The remote header comes from
   * a snapshot that decrypted with this vault's key, so it is authentic.
   */
  async mergeHeader(remote: VaultHeader): Promise<boolean> {
    const merged = mergeHeaders(this.requireUnlockedHeader(), remote);
    if (!merged) return false;
    await this.saveHeader(merged);
    return true;
  }

  // ---- Internals -------------------------------------------------------------------------

  private async rawKeyFor(header: VaultHeader, auth: ReAuth): Promise<Uint8Array<ArrayBuffer>> {
    if (auth.method === 'passkey') return this.rawKeyWithPasskey(header);
    const recoveryKey = parseRecoveryKey(auth.recoveryKey);
    if (!recoveryKey) throw new VaultError('invalidRecoveryKey');
    try {
      const slot = header.keySlots.find((s) => s.kind === 'recovery');
      if (!slot) throw new VaultError('corrupted');
      return await this.unwrap(
        () => recoveryKek(recoveryKey, header.vaultId).then((kek) => unwrapVaultKeyRaw(header, slot, kek)),
        'wrongRecoveryKey',
      );
    } finally {
      wipe(recoveryKey);
    }
  }

  private async rawKeyWithPasskey(header: VaultHeader): Promise<Uint8Array<ArrayBuffer>> {
    const slots = passkeySlotsFor(header, this.rpId);
    if (!slots.length) throw new VaultError('noPasskeyForSite');
    const assertion = await this.passkeys.assert({
      prfSalt: header.prfSalt,
      credentialIds: slots.map((s) => s.credentialId!),
    });
    try {
      const slot = slots.find((s) => s.credentialId === assertion.credentialId);
      if (!slot) throw new VaultError('unknownPasskey');
      return await this.unwrap(
        () => passkeyKek(assertion.prfOutput, header.vaultId).then((kek) => unwrapVaultKeyRaw(header, slot, kek)),
        'corrupted',
      );
    } finally {
      wipe(assertion.prfOutput);
    }
  }

  private async unwrap<T>(run: () => Promise<T>, onFail: VaultErrorCode): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (error instanceof VaultError) throw error;
      throw new VaultError(onFail, error);
    }
  }

  private requireHeader(): VaultHeader {
    const header = this._header();
    if (!header) throw new VaultError('corrupted');
    return header;
  }

  private requireUnlockedHeader(): VaultHeader {
    if (!this.key) throw new VaultError('locked');
    return this.requireHeader();
  }

  /** Earlier versions kept their only vault in the `locry` database; list it as a vault. */
  private async registerLegacyVault(): Promise<void> {
    if (await this.registry.legacyChecked()) return;
    const name = this.registry.legacyDbName;
    // `databases()` avoids creating an empty legacy database just to look into it.
    const exists = indexedDB.databases ? (await indexedDB.databases()).some((d) => d.name === name) : true;
    const header = exists ? await this.db.peekHeader(name) : undefined;
    if (isVaultHeader(header)) {
      await this.registry.put({ id: header.vaultId, name: '', color: 'blue', dbName: name, createdAt: header.createdAt, order: 0 });
    }
    await this.registry.markLegacyChecked();
  }

  private async addVault(
    header: VaultHeader,
    profile: { name: string; color: VaultColor; updatedAt?: string },
  ): Promise<void> {
    const entry: VaultProfile = {
      id: header.vaultId,
      name: profile.name.trim(),
      color: profile.color,
      dbName: vaultDbName(header.vaultId),
      createdAt: header.createdAt,
      updatedAt: profile.updatedAt,
      order: Math.max(0, ...this._vaults().map((v) => v.order)) + 1,
    };
    if (this._status() === 'unlocked') this.lock();
    this.db.use(entry.dbName);
    await this.db.putHeader(header);
    await this.registry.put(entry);
    this._vaults.update((list) => [...list.filter((v) => v.id !== entry.id), entry]);
    this.activate(entry.id, header);
  }

  private async load(profile: VaultProfile): Promise<void> {
    this.db.use(profile.dbName);
    const header = await this.db.getHeader();
    if (!isVaultHeader(header)) throw new VaultError('corrupted');
    this.activate(profile.id, header);
  }

  private activate(vaultId: string, header: VaultHeader): void {
    this._header.set(header);
    this._activeId.set(vaultId);
    this._status.set('locked');
    try {
      localStorage.setItem(ACTIVE_VAULT_KEY, vaultId);
    } catch {
      // Storage may be unavailable (private mode); the first vault is used next time.
    }
  }

  private setEmpty(): void {
    this._header.set(null);
    this._activeId.set(null);
    this._status.set('empty');
  }

  private async saveHeader(header: VaultHeader): Promise<void> {
    await this.db.putHeader(header);
    this._header.set(header);
  }

  private setUnlocked(key: CryptoKey): void {
    this.key = key;
    this._status.set('unlocked');
  }
}

/** Account name of a vault's passkeys in the password manager, so vaults are told apart. */
function passkeyAccountName(vaultName: string): string {
  return vaultName ? `Locry · ${vaultName}` : 'Locry';
}

function readActiveVaultId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_VAULT_KEY);
  } catch {
    return null;
  }
}
