import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideBellOff, lucideInfo } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { PreferencesService } from '../../core/preferences.service';
import { RemindersService } from '../../core/reminders/reminders.service';

/** Task reminders on this device: on/off (asks the browser), the time for untimed tasks, a test. */
@Component({
  selector: 'app-reminders-card',
  imports: [HlmButton, HlmCardImports, NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideBell, lucideBellOff, lucideInfo })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard id="reminders">
      <div hlmCardHeader>
        <h2 hlmCardTitle>{{ 'reminders.title' | transloco }}</h2>
        <p hlmCardDescription>{{ 'reminders.description' | transloco }}</p>
      </div>
      <div hlmCardContent class="flex flex-col gap-4">
        @switch (reminders.permission()) {
          @case ('unsupported') {
            <p class="text-muted-foreground text-sm">{{ 'reminders.unsupported' | transloco }}</p>
          }
          @case ('denied') {
            <p class="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
              <ng-icon name="lucideBellOff" class="mt-0.5 shrink-0" />{{ 'reminders.denied' | transloco }}
            </p>
          }
        }
        @if (prefs.reminders() && reminders.permission() === 'granted') {
          <div class="flex flex-wrap items-center gap-3">
            <label for="reminder-time" class="text-sm">{{ 'reminders.defaultTime' | transloco }}</label>
            <input
              id="reminder-time"
              type="time"
              class="border-input bg-background focus-visible:ring-ring/50 h-8 rounded-md border px-2 text-sm outline-none focus-visible:ring-[3px]"
              [value]="prefs.reminderTime()"
              (change)="setTime($any($event.target).value)"
            />
          </div>
        }
        <p class="text-muted-foreground flex items-start gap-2 text-xs">
          <ng-icon name="lucideInfo" class="mt-0.5 shrink-0" />{{ 'reminders.whileOpen' | transloco }}
        </p>
      </div>
      @if (reminders.permission() !== 'unsupported') {
        <div hlmCardFooter class="justify-end gap-2">
          @if (prefs.reminders() && reminders.permission() === 'granted') {
            <button hlmBtn variant="ghost" size="sm" (click)="reminders.disable()">{{ 'reminders.disable' | transloco }}</button>
            <button hlmBtn variant="outline" size="sm" (click)="reminders.test()">{{ 'reminders.test' | transloco }}</button>
          } @else if (reminders.permission() !== 'denied') {
            <button hlmBtn size="sm" (click)="reminders.enable()"><ng-icon name="lucideBell" />{{ 'reminders.enable' | transloco }}</button>
          }
        </div>
      }
    </section>
  `,
})
export class RemindersCard {
  protected readonly reminders = inject(RemindersService);
  protected readonly prefs = inject(PreferencesService);

  protected setTime(value: string): void {
    if (/^\d{2}:\d{2}$/.test(value)) this.prefs.setReminders({ reminderTime: value });
  }
}
