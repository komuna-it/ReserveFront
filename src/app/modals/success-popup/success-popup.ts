import { Component, inject, input, output } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-success-popup',
  imports: [],
  templateUrl: './success-popup.html',
  styleUrl: './success-popup.css',
})
export class SuccessPopup {
  readonly loco = inject(TranslocoService);
  readonly titleText = input.required<string>();
  readonly bodyText = input<string>('');
  readonly buttonText = input<string>(this.loco.translate('USER_MODALS.CONFIRM'));
  readonly ok = output<void>();
}
