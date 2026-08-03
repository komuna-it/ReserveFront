import { Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationFacade } from '../../components/reservation/reservation.facade';

@Component({
  selector: 'app-success-popup',
  imports: [TranslocoPipe],
  templateUrl: './success-popup.html',
  styleUrl: './success-popup.css',
})
export class SuccessPopup {
  readonly titleText = input.required<string>();
  readonly bodyText = input<string>('');
  readonly facade = inject(ReservationFacade);

  readonly ok = output<void>();
  readonly cancel = output<void | null>();

  handleOk() {
    this.ok.emit();
  }

  handleCancel() {
    this.cancel.emit();
  }
}
