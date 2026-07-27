import { Component, inject, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco'; // if using transloco
import { PendingReservationsComponent } from '../../components/pending-reservations-component/pending-reservations-component';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AdminPage } from '../../admin';
@Component({
  selector: 'app-reservation-popup',
  imports: [TranslocoPipe],
  templateUrl: './reservationPopup.html',
  styleUrl: './reservationPopup.css',
})
export class ReservationPopup {
  readonly reservation = input<any | null>(null);
  readonly store = inject(ReservationStore);
  readonly parent = inject(AdminPage);
  readonly translocoService = inject(TranslocoService);

  closeModals() {
    this.store.popupMarkedReservationAsAccepted.set(false);
    this.store.popupMarkedReservationAsCanceled.set(false);
  }

  getTitle(): string {
    if (this.store.confirmMarkReservationAsAccepted() === true) {
      return this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.ACCEPTED');
    } else {
      return this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.REJECTED');
    }
  }

  sendText(): string {
    return this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.OK');
  }
}
