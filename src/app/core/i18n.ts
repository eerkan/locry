import { Injectable } from '@angular/core';
import type { Translation as TranslocoTranslation, TranslocoLoader } from '@jsverse/transloco';
import { BackupError } from './backup/backup-format';
import { DriveError } from './drive/google-auth';
import { PasskeyError } from './vault/passkey';
import { VaultError } from './vault/vault.service';

/** Loads translations from the bundled TS files, so the app needs no network to render. */
@Injectable({ providedIn: 'root' })
export class InlineTranslocoLoader implements TranslocoLoader {
  async getTranslation(lang: string): Promise<TranslocoTranslation> {
    if (lang === 'en') return (await import('../../i18n/en')).en;
    return (await import('../../i18n/tr')).tr;
  }
}

/** Maps an error to its translation key. */
export function errorKey(error: unknown): string {
  if (error instanceof PasskeyError) return `errors.passkey.${error.code}`;
  if (error instanceof VaultError) return `errors.vault.${error.code}`;
  if (error instanceof BackupError) return `errors.backup.${error.code}`;
  if (error instanceof DriveError) return `errors.drive.${error.code}`;
  return 'errors.unexpected';
}
