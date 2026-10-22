import type { KeySlot, VaultHeader } from '../vault/vault-header';
import { type SyncEntry, mergeEntries, mergeHeaders, versionOf } from './merge';

const note = (id: string, title: string, updatedAt: string): SyncEntry => ({ type: 'note', id, value: { id, title, updatedAt } });
const deleted = (id: string, deletedAt: string): SyncEntry => ({ type: 'tombstone', id, value: { type: 'note', deletedAt } });
const baseOf = (...entries: SyncEntry[]) => Object.fromEntries(entries.map((e) => [e.id, versionOf(e)]));

const copyOf = (loser: SyncEntry): SyncEntry => ({
  type: 'note',
  id: `${loser.id}-copy`,
  value: { ...(loser.value as object), title: `${(loser.value as { title: string }).title} (conflict)` },
});

describe('mergeEntries', () => {
  const v1 = note('n1', 'v1', '2026-01-01');

  it('takes records that only the other device has or changed', () => {
    const theirs = note('n1', 'theirs', '2026-01-02');
    const result = mergeEntries([v1], [theirs, note('n2', 'new', '2026-01-02')], baseOf(v1));
    expect(result.writes.map((e) => e.id)).toEqual(['n1', 'n2']);
    expect(result.copies).toEqual([]);
    expect(result.base['n1']).toBe(versionOf(theirs));
  });

  it('keeps local changes the other device has not seen', () => {
    const mine = note('n1', 'mine', '2026-01-02');
    expect(mergeEntries([mine], [v1], baseOf(v1)).writes).toEqual([]);
  });

  it('applies a deletion when the record was not edited here', () => {
    const result = mergeEntries([v1], [deleted('n1', '2026-01-03')], baseOf(v1));
    expect(result.writes).toEqual([deleted('n1', '2026-01-03')]);
  });

  it('lets an edit win over a deletion made on the other device', () => {
    const mine = note('n1', 'edited', '2026-01-02');
    const local = mergeEntries([mine], [deleted('n1', '2026-01-05')], baseOf(v1), copyOf);
    expect(local.writes).toEqual([]);
    expect(local.copies).toEqual([]);

    // And the other way round: the device that deleted takes the edit back.
    const remote = mergeEntries([deleted('n1', '2026-01-05')], [mine], baseOf(v1), copyOf);
    expect(remote.writes).toEqual([mine]);
  });

  it('keeps the newer edit and a copy of the older one when both devices edited', () => {
    const mine = note('n1', 'mine', '2026-01-02');
    const theirs = note('n1', 'theirs', '2026-01-03');
    const result = mergeEntries([mine], [theirs], baseOf(v1), copyOf);
    expect(result.writes).toEqual([theirs]);
    expect(result.copies.map((c) => (c.value as { title: string }).title)).toEqual(['mine (conflict)']);

    const reverse = mergeEntries([theirs], [mine], baseOf(v1), copyOf);
    expect(reverse.writes).toEqual([]);
    expect(reverse.copies.map((c) => (c.value as { title: string }).title)).toEqual(['mine (conflict)']);
  });

  it('treats identical copies as agreed, even without a common base', () => {
    const result = mergeEntries([v1], [{ ...v1, value: { ...(v1.value as object) } }], {}, copyOf);
    expect(result).toEqual({ writes: [], copies: [], base: baseOf(v1) });
  });
});

describe('mergeHeaders', () => {
  const slot = (id: string, kind: KeySlot['kind'], createdAt = '2026-01-01'): KeySlot => ({
    id,
    kind,
    label: id,
    createdAt,
    credentialId: kind === 'passkey' ? `cred-${id}` : undefined,
    wrappedKey: { iv: 'iv', ct: id },
  });
  const header = (slots: KeySlot[], removedSlotIds?: string[]): VaultHeader => ({
    version: 1,
    vaultId: 'v',
    prfSalt: 's',
    createdAt: '2026-01-01',
    keySlots: slots,
    check: { iv: 'a', ct: 'b' },
    removedSlotIds,
  });

  it('adds passkeys created on the other device', () => {
    const merged = mergeHeaders(header([slot('mac', 'passkey'), slot('r', 'recovery')]), header([slot('mac', 'passkey'), slot('r', 'recovery'), slot('phone', 'passkey')]));
    expect(merged?.keySlots.map((s) => s.id)).toEqual(['mac', 'r', 'phone']);
  });

  it('drops slots removed on the other device and keeps the newer recovery key', () => {
    const local = header([slot('mac', 'passkey'), slot('old', 'passkey'), slot('r1', 'recovery', '2026-01-01')]);
    const remote = header([slot('mac', 'passkey'), slot('r2', 'recovery', '2026-02-01')], ['old', 'r1']);
    const merged = mergeHeaders(local, remote)!;
    expect(merged.keySlots.map((s) => s.id)).toEqual(['mac', 'r2']);
    expect(merged.removedSlotIds).toEqual(['old', 'r1']);
  });

  it('reports no change for the same slots and ignores other vaults', () => {
    const h = header([slot('mac', 'passkey'), slot('r', 'recovery')]);
    expect(mergeHeaders(h, structuredClone(h))).toBeNull();
    expect(mergeHeaders(h, { ...h, vaultId: 'other', keySlots: [] })).toBeNull();
  });
});
