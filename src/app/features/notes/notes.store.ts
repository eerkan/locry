import { Injectable, computed } from '@angular/core';
import { injectEncryptedCollection } from '../../core/storage/encrypted-collection';
import { type Note, type NotePatch, compareNotes } from './note';

/** Decrypted notes, kept in memory while the vault is unlocked. */
@Injectable({ providedIn: 'root' })
export class NotesStore {
  private readonly collection = injectEncryptedCollection<Note>('note');

  readonly loaded = this.collection.loaded;
  readonly notes = computed(() => [...this.collection.items()].sort(compareNotes));
  readonly allTags = computed(() =>
    [...new Set(this.collection.items().flatMap((n) => n.tags))].sort((a, b) => a.localeCompare(b, 'tr')),
  );

  byId(id: string): Note | undefined {
    return this.collection.byId(id);
  }

  async create(patch: NotePatch = {}): Promise<Note> {
    const now = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      tags: [],
      pinned: false,
      archived: false,
      ...patch,
      createdAt: now,
      updatedAt: now,
    };
    await this.collection.put(note);
    return note;
  }

  async update(id: string, patch: NotePatch): Promise<void> {
    const current = this.byId(id);
    if (!current) return;
    await this.collection.put({ ...current, ...patch, updatedAt: new Date().toISOString() });
  }

  remove(id: string): Promise<void> {
    return this.collection.remove(id);
  }
}
