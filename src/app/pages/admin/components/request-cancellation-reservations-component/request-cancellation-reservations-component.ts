import { Component, computed, inject, input, OnInit } from '@angular/core';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { AuthService } from '../../../../auth/authService';
import { ReservationStatus } from '../../../../model/reservationStatus';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CalendarHelper } from '../../../../components/calendar/calendar.helper';
import { AdminPage } from '../../admin';
import { TableByStatus } from '../table-by-status/table-by-status';
import { Pagination } from '../../../../layout/pagination/pagination';

@Component({
  selector: 'app-request-cancellation-reservations-component',
  imports: [TableByStatus, Pagination],
  templateUrl: './request-cancellation-reservations-component.html',
  styleUrl: './request-cancellation-reservations-component.css',
})
export class RequestCancellationReservationsComponent {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);
  readonly translocoService = inject(TranslocoService);
  readonly calendarHelper = inject(CalendarHelper);
  readonly parent = inject(AdminPage);

  ngOnInit(): void {
    this.store.statusForAdminPage.set(ReservationStatus.REQUESTED_CANCELLATION);
    this.facade.getReservationsByStatus(ReservationStatus.REQUESTED_CANCELLATION);
  }
}
