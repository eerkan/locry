import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw, lucideShieldCheck } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import {
  DEFAULT_EMBEDDING_MODEL,
  EMBEDDING_MODELS,
  EMBEDDING_MODEL_IDS,
  type EmbeddingModelSpec,
} from '../../core/ai/embedding-protocol';
import { SemanticIndexService } from '../../core/ai/semantic-index.service';
import { PreferencesService } from '../../core/preferences.service';
import { SemanticStatus } from '../../shared/semantic-status';

/** Smart search: on/off, the embedding model of this vault, and the index. */
@Component({
  selector: 'app-ai-card',
  imports: [HlmAlertDialogImports, HlmBadge, HlmButton, HlmCardImports, NgIcon, SemanticStatus, TranslocoPipe],
  providers: [provideIcons({ lucideRefreshCw, lucideShieldCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h2 hlmCardTitle>{{ 'ai.title' | transloco }}</h2>
        <p hlmCardDescription>{{ 'ai.description' | transloco }}</p>
      </div>
      <div hlmCardContent class="flex flex-col gap-5">
        <app-semantic-status />
        @if (index.enabled()) {
          <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt class="text-muted-foreground">{{ 'ai.vectors' | transloco }}</dt>
            <dd>{{ index.vectors().size }} / {{ index.docs().length }}</dd>
          </dl>
        }

        <fieldset class="flex flex-col gap-3">
          <legend class="text-sm font-medium">{{ 'ai.models' | transloco }}</legend>
          <p class="text-muted-foreground -mt-1 text-xs">{{ 'ai.modelsDescription' | transloco }}</p>
          <div role="radiogroup" class="flex flex-col gap-2" [attr.aria-label]="'ai.models' | transloco">
            @for (model of models; track model.id) {
              <button
                type="button"
                role="radio"
                class="hover:bg-accent/50 flex flex-col gap-1 rounded-lg border p-3 text-start transition-colors"
                [class.border-primary]="model.id === current().id"
                [class.bg-accent]="model.id === current().id"
                [attr.aria-checked]="model.id === current().id"
                (click)="choose(model)"
              >
                <span class="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {{ model.name }}
                  @if (model.id === defaultId) {
                    <span hlmBadge variant="secondary">{{ 'ai.recommended' | transloco }}</span>
                  }
                  @if (model.desktopOnly) {
                    <span hlmBadge variant="outline">{{ 'ai.desktopOnly' | transloco }}</span>
                  }
                  @if (model.id === current().id && index.enabled()) {
                    <span hlmBadge>{{ 'ai.current' | transloco }}</span>
                  }
                </span>
                <span class="text-muted-foreground text-xs">{{ 'ai.modelNotes.' + model.id | transloco }}</span>
                <span class="text-muted-foreground text-xs">
                  {{ 'ai.modelMeta' | transloco: { size: model.downloadMb, dims: model.dimensions, tokens: format(model.maxTokens) } }}
                  · {{ 'ai.license' | transloco: { license: model.license } }}
                </span>
              </button>
            }
          </div>
        </fieldset>

        <p class="text-muted-foreground flex items-start gap-2 text-xs">
          <ng-icon name="lucideShieldCheck" class="mt-0.5 shrink-0" />
          {{ 'ai.privacy' | transloco }}
        </p>
      </div>
      @if (index.enabled()) {
        <div hlmCardFooter class="justify-end gap-2">
          <button hlmBtn variant="ghost" size="sm" (click)="disable()">{{ 'ai.disable' | transloco }}</button>
          <button hlmBtn variant="outline" size="sm" [disabled]="!index.ready() || !!index.indexing()" (click)="index.rebuild()">
            <ng-icon name="lucideRefreshCw" />
            {{ 'ai.rebuild' | transloco }}
          </button>
        </div>
      }
    </section>

    <hlm-alert-dialog [state]="pending() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && pending.set(null)">
      <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
        <hlm-alert-dialog-header>
          <h2 hlmAlertDialogTitle>{{ 'ai.switchTitle' | transloco: { name: pending()?.name } }}</h2>
          <p hlmAlertDialogDescription>
            {{ 'ai.switchDescription' | transloco: { size: pending()?.downloadMb, count: index.docs().length } }}
          </p>
        </hlm-alert-dialog-header>
        <hlm-alert-dialog-footer>
          <button hlmAlertDialogCancel>{{ 'pages.tasks.cancel' | transloco }}</button>
          <button hlmAlertDialogAction (click)="confirmSwitch(); ctx.close()">{{ 'ai.switchConfirm' | transloco }}</button>
        </hlm-alert-dialog-footer>
      </hlm-alert-dialog-content>
    </hlm-alert-dialog>
  `,
})
export class AiCard {
  protected readonly index = inject(SemanticIndexService);
  private readonly prefs = inject(PreferencesService);
  private readonly transloco = inject(TranslocoService);

  protected readonly models = EMBEDDING_MODEL_IDS.map((id) => EMBEDDING_MODELS[id]);
  protected readonly defaultId = DEFAULT_EMBEDDING_MODEL;
  protected readonly current = computed(() => this.index.spec());
  /** Model waiting for confirmation (switching re-downloads and re-indexes). */
  protected readonly pending = signal<EmbeddingModelSpec | null>(null);

  protected format(value: number): string {
    return new Intl.NumberFormat(this.prefs.lang()).format(value);
  }

  protected choose(model: EmbeddingModelSpec): void {
    if (model.id === this.current().id) return;
    if (!this.index.enabled()) {
      // Nothing to download or re-index yet.
      this.index.setModel(model.id);
      toast.info(this.transloco.translate('ai.selected'));
      return;
    }
    this.pending.set(model);
  }

  /** Reads the target synchronously: closing the dialog clears `pending`. */
  protected confirmSwitch(): void {
    const model = this.pending();
    if (!model) return;
    this.index.setModel(model.id);
    toast.success(this.transloco.translate('ai.switched'));
  }

  protected async disable(): Promise<void> {
    await this.index.disable();
    toast.success(this.transloco.translate('ai.disabled'));
  }
}
