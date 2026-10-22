import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw, lucideShieldCheck } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { EmbeddingService } from '../../core/ai/embedding.service';
import { SemanticIndexService } from '../../core/ai/semantic-index.service';
import { SemanticStatus } from '../../shared/semantic-status';

@Component({
  selector: 'app-ai-card',
  imports: [HlmButton, HlmCardImports, NgIcon, SemanticStatus, TranslocoPipe],
  providers: [provideIcons({ lucideRefreshCw, lucideShieldCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h2 hlmCardTitle>{{ 'ai.title' | transloco }}</h2>
        <p hlmCardDescription>{{ 'ai.description' | transloco }}</p>
      </div>
      <div hlmCardContent class="flex flex-col gap-4">
        <app-semantic-status />
        @if (index.enabled()) {
          <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt class="text-muted-foreground">{{ 'ai.model' | transloco }}</dt>
            <dd class="font-mono text-xs leading-5">{{ embedder.model }}</dd>
            <dt class="text-muted-foreground">{{ 'ai.vectors' | transloco }}</dt>
            <dd>{{ index.vectors().size }} / {{ index.docs().length }}</dd>
          </dl>
        }
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
  `,
})
export class AiCard {
  protected readonly index = inject(SemanticIndexService);
  protected readonly embedder = inject(EmbeddingService);
  private readonly transloco = inject(TranslocoService);

  protected async disable(): Promise<void> {
    await this.index.disable();
    toast.success(this.transloco.translate('ai.disabled'));
  }
}
