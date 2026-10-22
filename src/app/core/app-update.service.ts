import { Injectable, inject } from '@angular/core';
import { SwUpdate, type VersionReadyEvent } from '@angular/service-worker';
import { TranslocoService } from '@jsverse/transloco';
import { toast } from '@spartan-ng/brain/sonner';
import { filter } from 'rxjs';

/** Offers a reload when the service worker has downloaded a new version of the app. */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly updates = inject(SwUpdate);
  private readonly transloco = inject(TranslocoService);

  constructor() {
    if (!this.updates.isEnabled) return;
    this.updates.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() =>
        toast(this.transloco.translate('app.updateReady'), {
          duration: Infinity,
          action: { label: this.transloco.translate('app.reload'), onClick: () => location.reload() },
        }),
      );
    this.updates.unrecoverable.subscribe(() => location.reload());
  }
}
