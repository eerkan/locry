import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLock } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { type Lang, PreferencesService, type Theme } from '../../core/preferences.service';
import { StorageHealthService } from '../../core/storage/storage-health.service';
import { VaultService } from '../../core/vault/vault.service';
import { AiCard } from './ai-card';
import { BackupCard } from './backup-card';
import { DriveCard } from './drive-card';
import { PasskeysCard } from './passkeys-card';
import { RecoveryCard } from './recovery-card';

@Component({
  selector: 'app-settings-page',
  imports: [
    AiCard,
    BackupCard,
    DriveCard,
    HlmButton,
    HlmCardImports,
    HlmFieldImports,
    HlmSeparator,
    NgIcon,
    PasskeysCard,
    RecoveryCard,
    TranslocoPipe,
  ],
  providers: [provideIcons({ lucideLock })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-6">
      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>{{ 'pages.settings.appearance' | transloco }}</h2>
          <p hlmCardDescription>{{ 'pages.settings.appearanceDescription' | transloco }}</p>
        </div>
        <div hlmCardContent class="flex flex-col gap-4">
          <div hlmField orientation="horizontal" class="justify-between">
            <label hlmFieldLabel for="lang">{{ 'common.language' | transloco }}</label>
            <select id="lang" [class]="selectClass" (change)="setLang($event)">
              @for (lang of langs; track lang) {
                <option [value]="lang" [selected]="prefs.lang() === lang">{{ 'lang.' + lang | transloco }}</option>
              }
            </select>
          </div>
          <div hlmField orientation="horizontal" class="justify-between">
            <label hlmFieldLabel for="theme">{{ 'common.theme' | transloco }}</label>
            <select id="theme" [class]="selectClass" (change)="setTheme($event)">
              @for (theme of themes; track theme) {
                <option [value]="theme" [selected]="prefs.theme() === theme">{{ 'theme.' + theme | transloco }}</option>
              }
            </select>
          </div>
        </div>
      </section>

      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>{{ 'pages.settings.security' | transloco }}</h2>
          <p hlmCardDescription>{{ 'pages.settings.securityDescription' | transloco }}</p>
        </div>
        <div hlmCardContent class="flex flex-col gap-4">
          <div hlmField orientation="horizontal" class="justify-between">
            <div hlmFieldContent>
              <label hlmFieldLabel for="autolock">{{ 'pages.settings.autoLock' | transloco }}</label>
              <p hlmFieldDescription>{{ 'pages.settings.autoLockDescription' | transloco }}</p>
            </div>
            <select id="autolock" [class]="selectClass" (change)="setAutoLock($event)">
              @for (minutes of autoLockOptions; track minutes) {
                <option [value]="'' + minutes" [selected]="prefs.autoLockMinutes() === minutes">
                  {{ minutes === 0 ? ('pages.settings.autoLockOff' | transloco) : ('pages.settings.autoLockMinutes' | transloco: { value: minutes }) }}
                </option>
              }
            </select>
          </div>

          <hlm-separator />

          <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt class="text-muted-foreground">{{ 'pages.settings.createdAt' | transloco }}</dt>
            <dd>{{ createdAt() }}</dd>
            <dt class="text-muted-foreground">{{ 'pages.settings.passkeys' | transloco }}</dt>
            <dd>{{ 'pages.settings.passkeyCount' | transloco: { count: vault.passkeySlots().length } }}</dd>
            <dt class="text-muted-foreground">{{ 'pages.settings.encryption' | transloco }}</dt>
            <dd>{{ 'pages.settings.encryptionValue' | transloco }}</dd>
            @if (storage.persisted() !== null) {
              <dt class="text-muted-foreground">{{ 'pages.settings.storage' | transloco }}</dt>
              <dd class="flex flex-col gap-1">
                <span [class.text-amber-600]="!storage.persisted()" [class.dark:text-amber-500]="!storage.persisted()">
                  {{ (storage.persisted() ? 'pages.settings.storagePersisted' : 'pages.settings.storageNotPersisted') | transloco }}
                </span>
                @if (storage.estimate(); as estimate) {
                  <span class="text-muted-foreground text-xs">{{ 'pages.settings.storageUsage' | transloco: { used: formatBytes(estimate.usage) } }}</span>
                }
                @if (!storage.persisted()) {
                  <button hlmBtn variant="outline" size="xs" class="w-fit" (click)="storage.ensurePersisted()">
                    {{ 'pages.settings.storageRequest' | transloco }}
                  </button>
                }
              </dd>
            }
          </dl>
        </div>
        <div hlmCardFooter class="justify-end">
          <button hlmBtn variant="outline" (click)="vault.lock()">
            <ng-icon name="lucideLock" />
            {{ 'pages.settings.lockNow' | transloco }}
          </button>
        </div>
      </section>

      <app-passkeys-card />
      <app-recovery-card />
      <app-backup-card />
      <app-drive-card />
      <app-ai-card />
    </div>
  `,
})
export class SettingsPage {
  protected readonly prefs = inject(PreferencesService);
  protected readonly vault = inject(VaultService);
  protected readonly storage = inject(StorageHealthService);

  protected readonly langs: Lang[] = ['tr', 'en'];
  protected readonly themes: Theme[] = ['light', 'dark', 'system'];
  protected readonly autoLockOptions = [1, 5, 10, 15, 30, 60, 0];
  protected readonly selectClass =
    'border-input bg-background focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]';

  protected readonly createdAt = computed(() => {
    const createdAt = this.vault.header()?.createdAt;
    if (!createdAt) return '';
    return new Intl.DateTimeFormat(this.prefs.lang(), { dateStyle: 'long', timeStyle: 'short' }).format(
      new Date(createdAt),
    );
  });

  constructor() {
    void this.storage.refresh();
  }

  protected formatBytes(bytes: number): string {
    const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    return new Intl.NumberFormat(this.prefs.lang(), { style: 'unit', unit: units[unit], maximumFractionDigits: 1 }).format(value);
  }

  protected setLang(event: Event): void {
    this.prefs.setLang((event.target as HTMLSelectElement).value as Lang);
  }

  protected setTheme(event: Event): void {
    this.prefs.setTheme((event.target as HTMLSelectElement).value as Theme);
  }

  protected setAutoLock(event: Event): void {
    this.prefs.setAutoLockMinutes(Number((event.target as HTMLSelectElement).value));
  }
}
