import { Component, inject, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco'; // if using transloco
import { PendingReservationsComponent } from '../../components/pending-reservations-component/pending-reservations-component';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
@Component({
  selector: 'app-reservation-accepted',
  imports: [TranslocoPipe],
  templateUrl: './reservation-accepted.html',
  styleUrl: './reservation-accepted.css',
})
export class ReservationAccepted {
  readonly reservation = input<any | null>(null);
  readonly store = inject(ReservationStore);
  readonly parent = inject(PendingReservationsComponent);
  readonly translocoService = inject(TranslocoService);

  closeModals() {
    this.store.popupMarkedReservationAsAccepted.set(false);
  }
}
