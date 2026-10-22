import type { KeySlot, VaultHeader } from '../vault/vault-header';
import { TOMBSTONE_TYPE, isTombstone } from './sync-records';

/** A record as stored (tombstones included), decrypted. */
export interface SyncEntry {
  type: string;
  id: string;
  value: unknown;
}

export interface MergeResult {
  /** Entries to write locally (taken from the other device). */
  writes: SyncEntry[];
  /** Losing sides of edit conflicts, as new records (see `makeCopy`). */
  copies: SyncEntry[];
  /** The agreed version of every merged id afterwards. */
  base: Record<string, string>;
}

/**
 * Version of an entry: tombstones by deletion time, records by `updatedAt`. Records without
 * a timestamp compare by content so identical copies still count as equal.
 */
export function versionOf(entry: SyncEntry): string {
  if (entry.type === TOMBSTONE_TYPE && isTombstone(entry.value)) return `deleted:${entry.value.deletedAt}`;
  const updatedAt = (entry.value as { updatedAt?: unknown })?.updatedAt;
  return typeof updatedAt === 'string' ? `${entry.type}:${updatedAt}` : `${entry.type}:${JSON.stringify(entry.value)}`;
}

function timeOf(entry: SyncEntry): string {
  if (entry.type === TOMBSTONE_TYPE && isTombstone(entry.value)) return entry.value.deletedAt;
  const updatedAt = (entry.value as { updatedAt?: unknown })?.updatedAt;
  return typeof updatedAt === 'string' ? updatedAt : '';
}

const isDeleted = (entry: SyncEntry) => entry.type === TOMBSTONE_TYPE;
const sameContent = (a: SyncEntry, b: SyncEntry) => a.type === b.type && JSON.stringify(a.value) === JSON.stringify(b.value);

/**
 * Three-way merge of another device's entries into ours. `base` holds the version both sides
 * last agreed on; an entry changed on one side only is taken from that side. When both
 * changed, an edit beats a deletion (nothing is lost), otherwise the newer edit wins and the
 * older one is kept through `makeCopy` (e.g. a "conflict" copy of a note).
 */
export function mergeEntries(
  local: readonly SyncEntry[],
  remote: readonly SyncEntry[],
  base: Readonly<Record<string, string>>,
  makeCopy: (loser: SyncEntry) => SyncEntry | null = () => null,
): MergeResult {
  const ours = new Map(local.map((e) => [e.id, e]));
  const writes: SyncEntry[] = [];
  const copies: SyncEntry[] = [];
  const nextBase: Record<string, string> = { ...base };

  for (const theirs of remote) {
    const mine = ours.get(theirs.id);
    const theirVersion = versionOf(theirs);
    if (!mine) {
      writes.push(theirs);
      nextBase[theirs.id] = theirVersion;
      continue;
    }
    const myVersion = versionOf(mine);
    if (myVersion === theirVersion || sameContent(mine, theirs)) {
      nextBase[theirs.id] = myVersion;
      continue;
    }
    const agreed = base[theirs.id];
    const iChanged = myVersion !== agreed;
    const theyChanged = theirVersion !== agreed;
    if (!theyChanged) continue;
    if (!iChanged) {
      writes.push(theirs);
      nextBase[theirs.id] = theirVersion;
      continue;
    }

    // Both sides changed since they last agreed.
    let winner: SyncEntry;
    if (isDeleted(mine) !== isDeleted(theirs)) {
      winner = isDeleted(mine) ? theirs : mine;
    } else {
      const order = timeOf(theirs).localeCompare(timeOf(mine)) || theirVersion.localeCompare(myVersion);
      winner = order > 0 ? theirs : mine;
      const loser = winner === theirs ? mine : theirs;
      const copy = isDeleted(loser) ? null : makeCopy(loser);
      if (copy) copies.push(copy);
    }
    if (winner === theirs) writes.push(theirs);
    nextBase[theirs.id] = versionOf(winner);
  }
  return { writes, copies, base: nextBase };
}

/**
 * Combines the key slots of two copies of the same vault header: passkeys added on either
 * device are kept, slots removed on either device stay removed, and of two recovery slots
 * the newer one wins. Returns null when nothing changes for `local`.
 */
export function mergeHeaders(local: VaultHeader, remote: VaultHeader): VaultHeader | null {
  if (local.vaultId !== remote.vaultId) return null;
  const removed = new Set([...(local.removedSlotIds ?? []), ...(remote.removedSlotIds ?? [])]);

  const byId = new Map<string, KeySlot>();
  for (const slot of [...local.keySlots, ...remote.keySlots]) if (!byId.has(slot.id)) byId.set(slot.id, slot);
  const recovery = [...byId.values()]
    .filter((s) => s.kind === 'recovery' && !removed.has(s.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const stale of recovery.slice(1)) removed.add(stale.id);

  const keySlots = [...byId.values()].filter((s) => !removed.has(s.id));
  // Never end up without a way in: keep the local slots if the merge would remove all of them.
  if (!keySlots.some((s) => s.kind === 'recovery') && !keySlots.some((s) => s.kind === 'passkey')) return null;

  const merged: VaultHeader = { ...local, keySlots, removedSlotIds: [...removed].sort() };
  const unchanged =
    merged.keySlots.length === local.keySlots.length &&
    merged.keySlots.every((s, i) => s.id === local.keySlots[i].id) &&
    merged.removedSlotIds!.join() === [...(local.removedSlotIds ?? [])].sort().join();
  return unchanged ? null : merged;
}
