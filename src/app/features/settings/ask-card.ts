import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideShieldCheck } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { AskService } from '../../core/ai/ask.service';
import type { ChatModelId } from '../../core/ai/chat-protocol';
import { PreferencesService } from '../../core/preferences.service';
import { AskModelPicker } from '../../shared/ask-model-picker';

/** "Ask your notes": the language model of this device, and removing it. */
@Component({
  selector: 'app-ask-card',
  imports: [AskModelPicker, HlmButton, HlmCardImports, NgIcon, RouterLink, TranslocoPipe],
  providers: [provideIcons({ lucideShieldCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard id="ask">
      <div hlmCardHeader>
        <h2 hlmCardTitle>{{ 'ask.title' | transloco }}</h2>
        <p hlmCardDescription>{{ 'ask.description' | transloco }}</p>
      </div>
      <div hlmCardContent class="flex flex-col gap-4">
        <app-ask-model-picker [value]="prefs.askModel()" [active]="ask.enabled() ? prefs.askModel() : null" (valueChange)="choose($event)" />
        <p class="text-muted-foreground flex items-start gap-2 text-xs">
          <ng-icon name="lucideShieldCheck" class="mt-0.5 shrink-0" />{{ 'ask.privacy' | transloco }}
        </p>
      </div>
      <div hlmCardFooter class="justify-end gap-2">
        @if (ask.enabled()) {
          <button hlmBtn variant="ghost" size="sm" (click)="disable()">{{ 'ask.disable' | transloco }}</button>
        }
        <a hlmBtn variant="outline" size="sm" routerLink="/ask">{{ 'ask.open' | transloco }}</a>
      </div>
    </section>
  `,
})
export class AskCard {
  protected readonly ask = inject(AskService);
  protected readonly prefs = inject(PreferencesService);
  private readonly transloco = inject(TranslocoService);

  protected choose(id: ChatModelId): void {
    if (id === this.prefs.askModel()) return;
    void this.ask.setModel(id).catch((error) => console.error(error));
    toast.success(this.transloco.translate(this.ask.enabled() ? 'ask.switched' : 'ask.selected'));
  }

  protected async disable(): Promise<void> {
    await this.ask.disable();
    toast.success(this.transloco.translate('ask.disabled'));
  }
}
