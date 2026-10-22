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
  /** Versions in the other device's state just merged: the next merge with it compares to these. */
  remoteVersions: Record<string, string>;
}

/** What a merge compares against to tell who changed what. */
export interface MergeBases {
  /** Versions in this device's previous state from the other device (undefined: never merged it). */
  remote?: Readonly<Record<string, string>>;
  /** Versions this device last published (sync snapshot or backup), which others may have seen. */
  published: Readonly<Record<string, string>>;
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
 * Merges another device's entries into ours.
 *
 * "They changed" a record when it differs from what we last saw from that very device, so a
 * stale copy (an older backup, a device that has not seen our edit yet) never overwrites our
 * newer version. "I changed" it when it differs from what this device last published, i.e.
 * an edit the other device cannot have seen. Then:
 * - only they changed: theirs is taken if newer; if older, ours stays and theirs is kept as
 *   a copy (concurrent edits, nothing lost);
 * - both changed: the newer edit wins and the other is kept as a copy;
 * - an edit always beats a deletion, unless the deletion is the only change.
 */
export function mergeEntries(
  local: readonly SyncEntry[],
  remote: readonly SyncEntry[],
  bases: MergeBases,
  makeCopy: (loser: SyncEntry) => SyncEntry | null = () => null,
): MergeResult {
  const ours = new Map(local.map((e) => [e.id, e]));
  const writes: SyncEntry[] = [];
  const copies: SyncEntry[] = [];
  const keepCopy = (loser: SyncEntry) => {
    const copy = isDeleted(loser) ? null : makeCopy(loser);
    if (copy) copies.push(copy);
  };

  for (const theirs of remote) {
    const mine = ours.get(theirs.id);
    if (!mine) {
      writes.push(theirs);
      continue;
    }
    const theirVersion = versionOf(theirs);
    const myVersion = versionOf(mine);
    if (myVersion === theirVersion || sameContent(mine, theirs)) continue;
    // Never merged that device yet: it most likely started from what we published.
    const theyChanged = theirVersion !== (bases.remote ?? bases.published)[theirs.id];
    if (!theyChanged) continue;
    const iChanged = myVersion !== bases.published[theirs.id];

    if (isDeleted(mine) || isDeleted(theirs)) {
      // They edited what we deleted: the edit wins (on first contact only if it is newer than
      // the deletion; it may be an old copy). They deleted what we did not touch: delete.
      // They deleted what we edited: our edit wins.
      const editAfterDeletion = bases.remote !== undefined || timeOf(theirs) > timeOf(mine);
      if (isDeleted(mine) ? editAfterDeletion : !iChanged) writes.push(theirs);
      continue;
    }
    const theirsNewer = (timeOf(theirs).localeCompare(timeOf(mine)) || theirVersion.localeCompare(myVersion)) > 0;
    if (theirsNewer) {
      writes.push(theirs);
      if (iChanged) keepCopy(mine);
    } else {
      keepCopy(theirs);
    }
  }
  return { writes, copies, remoteVersions: Object.fromEntries(remote.map((e) => [e.id, versionOf(e)])) };
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
