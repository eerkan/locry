import { randomBytes } from '../crypto/bytes';
import {
  type VaultHeader,
  createCheck,
  createKeySlot,
  generateVaultKey,
  newPrfSalt,
  newVaultId,
  passkeyKek,
  recoveryKek,
  unwrapVaultKey,
} from './vault-header';

async function buildHeader() {
  const vaultId = newVaultId();
  const prf = randomBytes(32);
  const recovery = randomBytes(32);
  const vk = await generateVaultKey();
  const passkeySlot = await createKeySlot(vaultId, vk.raw, await passkeyKek(prf, vaultId), {
    kind: 'passkey',
    credentialId: 'cred-1',
    label: 'Test',
  });
  const recoverySlot = await createKeySlot(vaultId, vk.raw, await recoveryKek(recovery, vaultId), {
    kind: 'recovery',
    label: 'recovery',
  });
  const header: VaultHeader = {
    version: 1,
    vaultId,
    prfSalt: newPrfSalt(),
    createdAt: new Date().toISOString(),
    keySlots: [passkeySlot, recoverySlot],
    check: await createCheck(vaultId, vk.key),
  };
  return { header, prf, recovery, passkeySlot, recoverySlot };
}

describe('vault header', () => {
  it('unwraps the vault key from every slot', async () => {
    const { header, prf, recovery, passkeySlot, recoverySlot } = await buildHeader();
    await expect(unwrapVaultKey(header, passkeySlot, await passkeyKek(prf, header.vaultId))).resolves.toBeTruthy();
    await expect(
      unwrapVaultKey(header, recoverySlot, await recoveryKek(recovery, header.vaultId)),
    ).resolves.toBeTruthy();
  });

  it('rejects a wrong PRF output', async () => {
    const { header, passkeySlot } = await buildHeader();
    await expect(
      unwrapVaultKey(header, passkeySlot, await passkeyKek(randomBytes(32), header.vaultId)),
    ).rejects.toThrow();
  });

  it('separates passkey and recovery key derivations', async () => {
    const { header, prf, recoverySlot } = await buildHeader();
    // Same bytes, wrong derivation context: must not open the recovery slot.
    await expect(unwrapVaultKey(header, recoverySlot, await recoveryKek(prf, header.vaultId))).rejects.toThrow();
  });

  it('detects a slot moved to another position', async () => {
    const { header, prf, passkeySlot } = await buildHeader();
    const tampered = { ...passkeySlot, id: 'other-id' };
    await expect(unwrapVaultKey(header, tampered, await passkeyKek(prf, header.vaultId))).rejects.toThrow();
  });

  it('detects a check value from another vault', async () => {
    const a = await buildHeader();
    const b = await buildHeader();
    const mixed = { ...a.header, check: b.header.check };
    await expect(unwrapVaultKey(mixed, a.passkeySlot, await passkeyKek(a.prf, a.header.vaultId))).rejects.toThrow();
  });
});
