import { Component, inject, input } from '@angular/core';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-confirmation-popup',
  imports: [],
  templateUrl: './confirmation-popup.html',
  styleUrl: './confirmation-popup.css',
})
export class ConfirmationPopup {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly loco = inject(TranslocoService);

  readonly titleText = input<any | null>();
  readonly bodyText = input<any | null>();

  handleOk() {
    this.facade.closeModals();
  }
  handleCancel() {}
}
