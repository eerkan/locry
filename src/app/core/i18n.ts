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
    // One lazy chunk per language: only the active one is downloaded.
    switch (lang) {
      case 'tr':
        return (await import('../../i18n/tr')).tr;
      case 'zh':
        return (await import('../../i18n/zh')).zh;
      case 'es':
        return (await import('../../i18n/es')).es;
      case 'ar':
        return (await import('../../i18n/ar')).ar;
      case 'pt':
        return (await import('../../i18n/pt')).pt;
      case 'id':
        return (await import('../../i18n/id')).id;
      case 'fr':
        return (await import('../../i18n/fr')).fr;
      case 'ja':
        return (await import('../../i18n/ja')).ja;
      case 'ru':
        return (await import('../../i18n/ru')).ru;
      case 'de':
        return (await import('../../i18n/de')).de;
      default:
        return (await import('../../i18n/en')).en;
    }
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
