import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { VaultService } from '../vault/vault.service';

export interface StorageEstimate {
  usage: number;
  quota: number;
}

/**
 * All data lives in this browser only, so ask it not to evict our storage under pressure
 * ("persistent" storage) and report how much space is used.
 */
@Injectable({ providedIn: 'root' })
export class StorageHealthService {
  private readonly vault = inject(VaultService);

  private readonly _persisted = signal<boolean | null>(null);
  private readonly _estimate = signal<StorageEstimate | null>(null);
  /** null while unknown or unsupported. */
  readonly persisted = this._persisted.asReadonly();
  readonly estimate = this._estimate.asReadonly();

  constructor() {
    effect(() => {
      if (this.vault.isUnlocked()) untracked(() => void this.ensurePersisted());
    });
  }

  async refresh(): Promise<void> {
    const storage = navigator.storage;
    if (!storage) return;
    this._persisted.set(storage.persisted ? await storage.persisted() : null);
    if (storage.estimate) {
      const { usage = 0, quota = 0 } = await storage.estimate();
      this._estimate.set({ usage, quota });
    }
  }

  /** Requests persistence; browsers may grant it silently, prompt, or refuse. */
  async ensurePersisted(): Promise<boolean> {
    const storage = navigator.storage;
    if (!storage?.persist) return false;
    const granted = (await storage.persisted?.()) || (await storage.persist());
    await this.refresh();
    return granted;
  }
}
