import { Component, computed, inject } from '@angular/core';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { CalendarHelper } from '../../components/calendar/calendar.helper';
import { TranslocoPipe } from '@jsverse/transloco';
import { TextFormatingTool } from '../../tools/textFormatingTool';
import { ReservationStatus } from '../../model/reservationStatus';

@Component({
  selector: 'app-reservation-details-modal',
  imports: [TranslocoPipe],
  templateUrl: './reservation-details-modal.html',
  styleUrl: './reservation-details-modal.css',
})
export class ReservationDetailsModal {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly helper = inject(CalendarHelper);
  readonly tool = inject(TextFormatingTool);
  readonly ReservationStatus = ReservationStatus;
  readonly res = this.store.selectedReservation();
  readonly reservedBy = computed(() => {
    return this.store.allUsers().find((u) => u.id === this.res?.reservedBy);
  });
}
