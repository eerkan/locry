import { EMBEDDING_RECORD_TYPE } from '../ai/documents';

/** Left in place of a deleted record so the deletion reaches other devices. */
export const TOMBSTONE_TYPE = 'tombstone';
/** Per-vault bookkeeping of the sync engine (what was last agreed with other devices). */
export const SYNC_STATE_TYPE = 'sync-state';

/** Types that stay on this device: derived data and bookkeeping are never synced or backed up. */
export const LOCAL_ONLY_TYPES: ReadonlySet<string> = new Set([EMBEDDING_RECORD_TYPE, SYNC_STATE_TYPE]);

export interface TombstoneValue {
  /** Type of the record that was deleted. */
  type: string;
  deletedAt: string;
}

export function isTombstone(value: unknown): value is TombstoneValue {
  const t = value as TombstoneValue;
  return !!t && typeof t.type === 'string' && typeof t.deletedAt === 'string';
}
