import { type Signal, computed, effect, inject, signal, untracked } from '@angular/core';
import { VaultService } from '../vault/vault.service';
import { EncryptedStore } from './encrypted-store.service';

/**
 * In-memory view of one record type in the encrypted store. Decrypted when the vault
 * unlocks, wiped when it locks; writes are serialized so an older save can never land
 * after a newer one.
 */
export interface EncryptedCollection<T extends { id: string }> {
  readonly items: Signal<T[]>;
  readonly loaded: Signal<boolean>;
  byId(id: string): T | undefined;
  /** Inserts or replaces items in memory and persists them. */
  put(...items: T[]): Promise<void>;
  remove(...ids: string[]): Promise<void>;
}

/** Creates a collection for `type`. Must be called in an injection context (e.g. a field initializer). */
export function injectEncryptedCollection<T extends { id: string }>(type: string): EncryptedCollection<T> {
  const store = inject(EncryptedStore);
  const vault = inject(VaultService);

  const items = signal<T[]>([]);
  const loaded = signal(false);
  const index = computed(() => new Map(items().map((item) => [item.id, item])));
  let generation = 0;
  let localWrites = 0;
  let writes: Promise<unknown> = Promise.resolve();

  const enqueue = (write: () => Promise<unknown>): Promise<void> => {
    const next = writes.then(write).then(() => undefined);
    // Keep the chain alive after a failure; the caller still sees the rejection.
    writes = next.catch(() => undefined);
    return next;
  };

  const load = async (): Promise<void> => {
    const current = ++generation;
    const writesAtStart = localWrites;
    const decrypted = await store.list<T>(type);
    if (current !== generation) return;
    // A put or remove landed while reading: the result may predate it, so read again once
    // the pending writes are stored instead of overwriting the newer in-memory state.
    if (localWrites !== writesAtStart) return void writes.then(() => (current === generation ? load() : undefined));
    items.set(decrypted);
    loaded.set(true);
  };

  const clear = () => {
    generation++;
    items.set([]);
    loaded.set(false);
  };

  effect(() => {
    const unlocked = vault.isUnlocked();
    vault.activeVault()?.id;
    store.revision();
    untracked(() => (unlocked ? void load() : clear()));
  });

  return {
    items: items.asReadonly(),
    loaded: loaded.asReadonly(),
    byId: (id) => index().get(id),
    put(...next) {
      localWrites++;
      const byId = new Map(next.map((item) => [item.id, item]));
      items.update((current) => {
        const merged = current.map((item) => byId.get(item.id) ?? item);
        const existing = new Set(current.map((item) => item.id));
        return [...merged, ...next.filter((item) => !existing.has(item.id))];
      });
      return enqueue(() => Promise.all(next.map((item) => store.put(type, item.id, item))));
    },
    remove(...ids) {
      localWrites++;
      const removed = new Set(ids);
      items.update((current) => current.filter((item) => !removed.has(item.id)));
      return enqueue(() => Promise.all(ids.map((id) => store.remove(type, id))));
    },
  };
}
