import { Component, inject } from '@angular/core';
import { ReservationStatus } from '../../../../model/reservationStatus';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextFormatingTool } from '../../../../tools/textFormatingTool';
import { CalendarHelper } from '../../../../components/calendar/calendar.helper';

@Component({
  selector: 'app-user-reservations',
  imports: [TranslocoPipe],
  templateUrl: './user-reservations.html',
  styleUrl: './user-reservations.css',
})
export class UserReservations {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly translocoService = inject(TranslocoService);
  readonly helper = inject(TextFormatingTool);
  readonly calendarHelper = inject(CalendarHelper);
  readonly ReservationStatus = ReservationStatus;
}
