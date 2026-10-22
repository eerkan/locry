import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { isGoogleClientId } from '../core/drive/google-auth';
import { PreferencesService } from '../core/preferences.service';

/** Explains the one-time Google Cloud setup and stores the user's OAuth Client ID. */
@Component({
  selector: 'app-drive-setup',
  imports: [HlmButton, HlmFieldImports, HlmInput, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4' },
  template: `
    <p class="text-sm">{{ 'drive.setupIntro' | transloco }}</p>
    <ol class="text-muted-foreground flex list-decimal flex-col gap-1.5 ps-5 text-sm">
      <li>{{ 'drive.step1' | transloco }}</li>
      <li>{{ 'drive.step2' | transloco }}</li>
      <li>{{ 'drive.step3' | transloco }}</li>
      <li>{{ 'drive.step4' | transloco: { origin: origin } }}</li>
      <li>{{ 'drive.step5' | transloco }}</li>
    </ol>
    <form class="flex flex-col gap-2" (submit)="$event.preventDefault(); save()">
      <div hlmField>
        <label hlmFieldLabel for="drive-client-id">{{ 'drive.clientId' | transloco }}</label>
        <div class="flex gap-2">
          <input
            hlmInput
            id="drive-client-id"
            class="flex-1 font-mono text-xs"
            autocomplete="off"
            spellcheck="false"
            placeholder="1234567890-abc.apps.googleusercontent.com"
            [value]="draft()"
            (input)="draft.set($any($event.target).value); invalid.set(false)"
          />
          @if (cancellable()) {
            <button hlmBtn type="button" variant="outline" (click)="cancelled.emit()">{{ 'pages.tasks.cancel' | transloco }}</button>
          }
          <button hlmBtn type="submit" [disabled]="!draft().trim()">{{ 'drive.saveClientId' | transloco }}</button>
        </div>
        @if (invalid()) {
          <p class="text-destructive text-sm">{{ 'drive.invalidClientId' | transloco }}</p>
        }
      </div>
    </form>
  `,
})
export class DriveSetup {
  private readonly prefs = inject(PreferencesService);
  /** Show a cancel button (when replacing an existing Client ID). */
  readonly cancellable = input(false);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly origin = location.origin;
  protected readonly draft = signal(this.prefs.driveClientId());
  protected readonly invalid = signal(false);

  protected save(): void {
    const clientId = this.draft().trim();
    if (!isGoogleClientId(clientId)) {
      this.invalid.set(true);
      return;
    }
    this.prefs.setDrive({ driveClientId: clientId });
    this.saved.emit();
  }
}
