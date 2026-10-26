import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { CHAT_MODELS, CHAT_MODEL_IDS, type ChatModelId, DEFAULT_CHAT_MODEL } from '../core/ai/chat-protocol';

/** The language models to choose from, with download size and license. */
@Component({
  selector: 'app-ask-model-picker',
  imports: [HlmBadge, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="radiogroup" class="flex flex-col gap-2" [attr.aria-label]="'ask.chooseModel' | transloco">
      @for (model of models; track model.id) {
        <button
          type="button"
          role="radio"
          class="hover:bg-accent/50 flex flex-col gap-1 rounded-lg border p-3 text-start transition-colors"
          [class.border-primary]="model.id === value()"
          [class.bg-accent]="model.id === value()"
          [attr.aria-checked]="model.id === value()"
          (click)="valueChange.emit(model.id)"
        >
          <span class="flex flex-wrap items-center gap-2 text-sm font-medium">
            {{ model.name }}
            @if (model.id === defaultId) {
              <span hlmBadge variant="secondary">{{ 'ask.recommended' | transloco }}</span>
            }
            @if (model.id === active()) {
              <span hlmBadge>{{ 'ai.current' | transloco }}</span>
            }
          </span>
          <span class="text-muted-foreground text-xs">{{ 'ask.modelNotes.' + model.id | transloco }}</span>
          <span class="text-muted-foreground text-xs">{{ 'ask.modelMeta' | transloco: { size: model.downloadMb.q4f16, license: model.license } }}</span>
        </button>
      }
    </div>
  `,
})
export class AskModelPicker {
  readonly value = input.required<ChatModelId>();
  /** The model in use, marked as such; null while the feature is off. */
  readonly active = input<ChatModelId | null>(null);
  readonly valueChange = output<ChatModelId>();

  protected readonly models = CHAT_MODEL_IDS.map((id) => CHAT_MODELS[id]);
  protected readonly defaultId = DEFAULT_CHAT_MODEL;
}
