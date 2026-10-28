import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMic, lucideSquare } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { DictationFailure, DictationService, MAX_RECORDING_MS } from '../core/voice/dictation.service';

let nextId = 0;

/**
 * A microphone button for dictation: click to record, click again to stop; the transcript is
 * emitted. The first time it explains the one-time model download and asks first.
 */
@Component({
  selector: 'app-dictate-button',
  imports: [HlmAlertDialogImports, HlmButton, HlmSpinner, HlmTooltip, NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideMic, lucideSquare })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center', '(document:keydown.escape)': 'recording() && cancel()' },
  template: `
    @if (dictation.supported) {
      @if (recording()) {
        <button
          type="button"
          hlmBtn
          variant="destructive"
          [size]="size()"
          class="gap-1.5 tabular-nums"
          [attr.aria-label]="'voice.stop' | transloco"
          (click)="finish()"
        >
          <span class="size-2 animate-pulse rounded-full bg-white motion-reduce:animate-none" aria-hidden="true"></span>
          <ng-icon name="lucideSquare" class="text-[10px]" />
          {{ elapsed() }}
        </button>
      } @else if (busy()) {
        <span class="text-muted-foreground inline-flex h-8 items-center gap-1.5 px-2 text-xs" role="status">
          <hlm-spinner class="size-3.5" />
          {{ busyLabel() }}
        </span>
      } @else {
        <button
          type="button"
          hlmBtn
          variant="ghost"
          [size]="size() === 'sm' ? 'icon-sm' : 'icon'"
          [hlmTooltip]="'voice.dictate' | transloco"
          [attr.aria-label]="'voice.dictate' | transloco"
          [disabled]="otherBusy()"
          (click)="begin()"
        >
          <ng-icon name="lucideMic" />
        </button>
      }

      <hlm-alert-dialog [state]="confirming() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && confirming.set(false)">
        <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
          <hlm-alert-dialog-header>
            <h2 hlmAlertDialogTitle>{{ 'voice.downloadTitle' | transloco }}</h2>
            <p hlmAlertDialogDescription>
              {{ 'voice.downloadDescription' | transloco: { model: dictation.spec().name, size: dictation.spec().gpu.downloadMb } }}
            </p>
          </hlm-alert-dialog-header>
          <hlm-alert-dialog-footer>
            <button hlmAlertDialogCancel>{{ 'pages.tasks.cancel' | transloco }}</button>
            <button hlmAlertDialogAction (click)="ctx.close(); start()">{{ 'voice.downloadAndStart' | transloco }}</button>
          </hlm-alert-dialog-footer>
        </hlm-alert-dialog-content>
      </hlm-alert-dialog>
    }
  `,
})
export class DictateButton {
  readonly size = input<'sm' | 'default'>('sm');
  readonly transcript = output<string>();

  protected readonly dictation = inject(DictationService);
  private readonly transloco = inject(TranslocoService);
  private readonly id = `dictate-${nextId++}`;
  protected readonly confirming = signal(false);
  private readonly now = signal(Date.now());

  protected readonly mine = computed(() => this.dictation.owner() === this.id);
  protected readonly recording = computed(() => this.mine() && this.dictation.state() === 'recording');
  protected readonly busy = computed(() => this.mine() && (this.dictation.state() === 'transcribing' || this.dictation.state() === 'loading'));
  /** Another button is recording: one dictation at a time. */
  protected readonly otherBusy = computed(() => !this.mine() && this.dictation.state() === 'recording');
  protected readonly elapsed = computed(() => {
    const start = this.dictation.startedAt();
    const seconds = start ? Math.max(0, Math.floor((this.now() - start) / 1000)) : 0;
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });
  protected readonly busyLabel = computed(() => {
    const progress = this.dictation.progress();
    return progress > 0 && progress < 1
      ? this.transloco.translate('voice.downloading', { percent: Math.round(progress * 100) })
      : this.transloco.translate('voice.transcribing');
  });

  constructor() {
    // A clock for the elapsed time, and the length limit.
    let timer: ReturnType<typeof setInterval> | undefined;
    effect(() => {
      clearInterval(timer);
      if (!this.recording()) return;
      timer = setInterval(() => {
        this.now.set(Date.now());
        const start = this.dictation.startedAt();
        if (start && Date.now() - start >= MAX_RECORDING_MS) void this.finish();
      }, 250);
    });
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      if (this.mine()) this.dictation.cancel();
    });
  }

  protected begin(): void {
    if (this.dictation.enabled()) void this.start();
    else this.confirming.set(true);
  }

  protected async start(): Promise<void> {
    try {
      await this.dictation.start(this.id);
      this.now.set(Date.now());
    } catch (error) {
      this.fail(error);
    }
  }

  protected async finish(): Promise<void> {
    try {
      const text = await this.dictation.stop();
      if (text) this.transcript.emit(text);
    } catch (error) {
      this.fail(error);
    }
  }

  protected cancel(): void {
    this.dictation.cancel();
  }

  private fail(error: unknown): void {
    const code = error instanceof DictationFailure ? error.code : 'failed';
    if (!(error instanceof DictationFailure)) console.error(error);
    toast.error(this.transloco.translate(`voice.errors.${code}`));
  }
}
