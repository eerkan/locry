import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleCheck, lucideSparkles, lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { EmbeddingService } from '../core/ai/embedding.service';
import { SemanticIndexService } from '../core/ai/semantic-index.service';

/** Shows the semantic search state and lets the user turn it on or retry. */
@Component({
  selector: 'app-semantic-status',
  imports: [HlmButton, HlmSpinner, NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideSparkles, lucideCircleCheck, lucideTriangleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!index.enabled()) {
      <div class="bg-muted/50 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
        <ng-icon name="lucideSparkles" class="text-primary shrink-0 text-xl" />
        <div class="flex flex-1 flex-col gap-1">
          <p class="text-sm font-medium">{{ 'pages.search.semanticOffTitle' | transloco }}</p>
          <p class="text-muted-foreground text-xs">{{ 'pages.search.semanticOffDescription' | transloco: { model: index.spec().name, size: index.spec().downloadMb } }}</p>
        </div>
        <button hlmBtn size="sm" (click)="index.enable()">{{ 'pages.search.enable' | transloco }}</button>
      </div>
    } @else {
      <div class="text-muted-foreground flex items-center gap-2 text-xs" aria-live="polite">
        @switch (embedder.status()) {
          @case ('error') {
            <ng-icon name="lucideTriangleAlert" class="text-destructive" />
            <span class="text-destructive">{{ 'pages.search.error' | transloco }}</span>
            <button hlmBtn variant="link" size="xs" (click)="retry()">{{ 'pages.search.retry' | transloco }}</button>
          }
          @case ('ready') {
            @if (index.indexing(); as progress) {
              <hlm-spinner class="size-3" />
              {{ 'pages.search.indexing' | transloco: progress }}
            } @else {
              <ng-icon name="lucideCircleCheck" class="text-green-600 dark:text-green-500" />
              {{ 'pages.search.ready' | transloco }}
            }
          }
          @default {
            <hlm-spinner class="size-3" />
            @if (percent() > 0 && percent() < 100) {
              {{ 'pages.search.loading' | transloco: { percent: percent() } }}
              <span class="bg-muted relative h-1.5 w-32 overflow-hidden rounded-full">
                <span class="bg-primary absolute inset-y-0 start-0 transition-all" [style.width.%]="percent()"></span>
              </span>
            } @else {
              {{ 'pages.search.starting' | transloco }}
            }
          }
        }
      </div>
    }
  `,
})
export class SemanticStatus {
  protected readonly index = inject(SemanticIndexService);
  protected readonly embedder = inject(EmbeddingService);
  protected readonly percent = computed(() => Math.round(this.embedder.progress() * 100));

  protected retry(): void {
    void this.embedder.start().catch((error) => console.error(error));
  }
}
