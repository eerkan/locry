import { Injectable, computed, inject, signal } from '@angular/core';
import { importAesKey } from '../crypto/aead';
import { wipe } from '../crypto/bytes';
import { formatRecoveryKey, generateRecoveryKey, parseRecoveryKey } from '../crypto/recovery-key';
import { LocryDb } from '../storage/locry-db';
import { PasskeyClient, currentRpId } from './passkey';
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
} from './vault-header';

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
  | 'noPasskeyForSite';

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

  private readonly _status = signal<VaultStatus>('loading');
  private readonly _header = signal<VaultHeader | null>(null);
  private readonly _lockCount = signal(0);
  private key: CryptoKey | null = null;
  private initPromise?: Promise<void>;

  readonly status = this._status.asReadonly();
  readonly header = this._header.asReadonly();
  readonly isUnlocked = computed(() => this._status() === 'unlocked');
  /** Increments every time an unlocked vault locks; lets others react to locking reliably. */
  readonly lockCount = this._lockCount.asReadonly();
  readonly passkeySlots = computed(() => this._header()?.keySlots.filter((s) => s.kind === 'passkey') ?? []);
  /** This page's site; passkeys only work on the site they were created for. */
  readonly rpId = currentRpId();
  /** Passkeys that can unlock the vault on this site. */
  readonly localPasskeySlots = computed(() => {
    const header = this._header();
    return header ? passkeySlotsFor(header, this.rpId) : [];
  });

  /** Loads the vault header from IndexedDB. Safe to call repeatedly. */
  init(): Promise<void> {
    this.initPromise ??= (async () => {
      const header = await this.db.getHeader();
      if (header && !isVaultHeader(header)) throw new VaultError('corrupted');
      this._header.set(header ?? null);
      this._status.set(header ? 'locked' : 'empty');
    })();
    return this.initPromise;
  }

  // ---- Setup -----------------------------------------------------------------------------

  /**
   * Step 1 of setup: registers a passkey and builds the vault in memory, with a passkey slot
   * and a recovery slot. Nothing is written until {@link completeSetup}.
   */
  async prepareVault(passkeyLabel: string): Promise<PendingVault> {
    const vaultId = newVaultId();
    const prfSalt = newPrfSalt();
    const registration = await this.passkeys.register({ userName: passkeyLabel, displayName: passkeyLabel, prfSalt });

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
      return { header, key: vaultKey.key, recoveryKey: formatRecoveryKey(recoveryKey) };
    } finally {
      wipe(vaultKey.raw);
      wipe(recoveryKey);
      wipe(registration.prfOutput);
    }
  }

  /** Step 2 of setup: persists the vault once the user confirmed the recovery key, and unlocks it. */
  async completeSetup(pending: PendingVault): Promise<void> {
    await this.saveHeader(pending.header);
    this.setUnlocked(pending.key);
  }

  /** Takes over an existing vault (from a backup) on an empty device and unlocks it. */
  async adoptVault(header: VaultHeader, key: CryptoKey): Promise<void> {
    if (this._header()) throw new VaultError('corrupted');
    await this.saveHeader(header);
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

  lock(): void {
    this.key = null;
    if (this._status() !== 'unlocked') return;
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
      const registration = await this.passkeys.register({
        userName: label,
        displayName: label,
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
    await this.saveHeader({ ...header, keySlots: header.keySlots.filter((s) => s.id !== slotId) });
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
    await this.saveHeader({ ...current, keySlots: [...current.keySlots.filter((s) => s.kind !== 'recovery'), recovery] });
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

  private async saveHeader(header: VaultHeader): Promise<void> {
    await this.db.putHeader(header);
    this._header.set(header);
  }

  private setUnlocked(key: CryptoKey): void {
    this.key = key;
    this._status.set('unlocked');
  }
}
