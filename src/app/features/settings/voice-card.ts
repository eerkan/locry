import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlay, lucideShieldCheck, lucideSquare } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { LANGS, LANGUAGE_NAMES, isLang } from '../../core/languages';
import { type DictationLang, PreferencesService } from '../../core/preferences.service';
import { DictationService } from '../../core/voice/dictation.service';
import { ReadAloudService } from '../../core/voice/read-aloud.service';
import { DEFAULT_SPEECH_MODEL, SPEECH_MODELS, SPEECH_MODEL_IDS, type SpeechModelId } from '../../core/voice/speech-protocol';

const RATES = [0.8, 1, 1.2, 1.5];

/** Dictation (Whisper on this device) and reading notes aloud (this device's voices). */
@Component({
  selector: 'app-voice-card',
  imports: [HlmBadge, HlmButton, HlmCardImports, NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucidePlay, lucideShieldCheck, lucideSquare })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard id="voice">
      <div hlmCardHeader>
        <h2 hlmCardTitle>{{ 'voice.title' | transloco }}</h2>
        <p hlmCardDescription>{{ 'voice.description' | transloco }}</p>
      </div>
      <div hlmCardContent class="flex flex-col gap-6">
        <div class="flex flex-col gap-3">
          <h3 class="text-sm font-medium">{{ 'voice.dictation' | transloco }}</h3>
          @if (!dictation.supported) {
            <p class="text-muted-foreground text-sm">{{ 'voice.errors.unsupported' | transloco }}</p>
          } @else {
            <div role="radiogroup" class="flex flex-col gap-2" [attr.aria-label]="'voice.model' | transloco">
              @for (model of models; track model.id) {
                <button
                  type="button"
                  role="radio"
                  class="hover:bg-accent/50 flex flex-col gap-1 rounded-lg border p-3 text-start transition-colors"
                  [class.border-primary]="model.id === prefs.speechModel()"
                  [class.bg-accent]="model.id === prefs.speechModel()"
                  [attr.aria-checked]="model.id === prefs.speechModel()"
                  (click)="choose(model.id)"
                >
                  <span class="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {{ model.name }}
                    @if (model.id === defaultModel) {
                      <span hlmBadge variant="secondary">{{ 'ask.recommended' | transloco }}</span>
                    }
                    @if (prefs.speechEnabled() && model.id === prefs.speechModel()) {
                      <span hlmBadge>{{ 'ai.current' | transloco }}</span>
                    }
                  </span>
                  <span class="text-muted-foreground text-xs">
                    @if (model.cpu) {
                      {{ 'voice.sizes' | transloco: { gpu: model.gpu.downloadMb, cpu: model.cpu.downloadMb } }}
                    } @else {
                      {{ 'voice.sizeGpuOnly' | transloco: { gpu: model.gpu.downloadMb } }}
                    }
                  </span>
                  <span class="text-muted-foreground text-xs">{{ 'voice.models.' + model.id | transloco }}</span>
                </button>
              }
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <label for="dictation-lang" class="text-sm">{{ 'voice.language' | transloco }}</label>
              <select id="dictation-lang" [class]="selectClass" (change)="setLang($any($event.target).value)">
                <option value="interface" [selected]="prefs.dictationLang() === 'interface'">
                  {{ 'voice.languageInterface' | transloco: { name: names[prefs.lang()] } }}
                </option>
                <option value="auto" [selected]="prefs.dictationLang() === 'auto'">{{ 'voice.languageAuto' | transloco }}</option>
                @for (lang of langs; track lang) {
                  <option [value]="lang" [selected]="prefs.dictationLang() === lang">{{ names[lang] }}</option>
                }
              </select>
            </div>
            <p class="text-muted-foreground flex items-start gap-2 text-xs">
              <ng-icon name="lucideShieldCheck" class="mt-0.5 shrink-0" />{{ 'voice.privacy' | transloco }}
            </p>
          }
        </div>

        <div class="flex flex-col gap-3 border-t pt-5">
          <h3 class="text-sm font-medium">{{ 'voice.reading' | transloco }}</h3>
          @if (!readAloud.supported) {
            <p class="text-muted-foreground text-sm">{{ 'voice.noSynthesis' | transloco }}</p>
          } @else if (!voices().length) {
            <p class="text-muted-foreground text-sm">{{ 'voice.noVoice' | transloco }}</p>
          } @else {
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <label for="read-voice" class="text-sm">{{ 'voice.voice' | transloco }}</label>
                <select id="read-voice" [class]="selectClass" (change)="setVoice($any($event.target).value)">
                  @for (voice of voices(); track voice.voiceURI) {
                    <option [value]="voice.voiceURI" [selected]="voice.voiceURI === selectedVoice()">{{ voice.name }} ({{ voice.lang }})</option>
                  }
                </select>
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="read-rate" class="text-sm">{{ 'voice.rate' | transloco }}</label>
                <select id="read-rate" [class]="selectClass" (change)="setRate($any($event.target).value)">
                  @for (rate of rates; track rate) {
                    <option [value]="rate" [selected]="rate === prefs.readRate()">{{ rate }}×</option>
                  }
                </select>
              </div>
            </div>
            <p class="text-muted-foreground text-xs">{{ 'voice.readingNote' | transloco }}</p>
          }
        </div>
      </div>
      <div hlmCardFooter class="justify-end gap-2">
        @if (prefs.speechEnabled()) {
          <button hlmBtn variant="ghost" size="sm" (click)="disableDictation()">{{ 'voice.removeModel' | transloco }}</button>
        }
        @if (readAloud.supported && voices().length) {
          <button hlmBtn variant="outline" size="sm" (click)="sample()">
            <ng-icon [name]="readAloud.owner() === 'sample' ? 'lucideSquare' : 'lucidePlay'" />
            {{ (readAloud.owner() === 'sample' ? 'voice.stopReading' : 'voice.listen') | transloco }}
          </button>
        }
      </div>
    </section>
  `,
})
export class VoiceCard {
  protected readonly prefs = inject(PreferencesService);
  protected readonly dictation = inject(DictationService);
  protected readonly readAloud = inject(ReadAloudService);
  private readonly transloco = inject(TranslocoService);

  protected readonly models = SPEECH_MODEL_IDS.map((id) => SPEECH_MODELS[id]);
  protected readonly defaultModel = DEFAULT_SPEECH_MODEL;
  protected readonly langs = LANGS;
  protected readonly names = LANGUAGE_NAMES;
  protected readonly rates = RATES;
  protected readonly selectClass =
    'border-input bg-background focus-visible:ring-ring/50 h-9 rounded-md border px-2 text-sm outline-none focus-visible:ring-[3px]';
  /** On-device voices for the interface language. */
  protected readonly voices = computed(() => this.readAloud.voicesFor(this.prefs.lang()));
  protected readonly selectedVoice = computed(() => this.readAloud.voiceFor(this.prefs.lang())?.voiceURI ?? null);

  protected choose(id: SpeechModelId): void {
    if (id === this.prefs.speechModel()) return;
    void this.dictation.setModel(id);
    toast.success(this.transloco.translate(this.prefs.speechEnabled() ? 'voice.switched' : 'voice.selected'));
  }

  protected setLang(value: string): void {
    if (value === 'interface' || value === 'auto' || isLang(value)) this.prefs.setVoice({ dictationLang: value as DictationLang });
  }

  protected setVoice(uri: string): void {
    this.prefs.setVoice({ readVoice: uri });
  }

  protected setRate(value: string): void {
    const rate = Number(value);
    if (RATES.includes(rate)) this.prefs.setVoice({ readRate: rate });
  }

  protected sample(): void {
    if (this.readAloud.owner() === 'sample') this.readAloud.stop();
    else this.readAloud.speak(this.transloco.translate('voice.sampleText'), this.prefs.lang(), 'sample');
  }

  protected async disableDictation(): Promise<void> {
    await this.dictation.disable();
    toast.success(this.transloco.translate('voice.removed'));
  }
}
