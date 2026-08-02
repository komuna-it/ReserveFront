import { Component, computed, inject, input, OnInit } from '@angular/core';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { AuthService } from '../../../../auth/authService';
import { ReservationStatus } from '../../../../model/reservationStatus';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CalendarHelper } from '../../../../components/calendar/calendar.helper';
import { AdminPage } from '../../admin';
import { TableByStatus } from '../table-by-status/table-by-status';
import { ConfirmationPopup } from '../../../../modals/confirmation-popup/confirmation-popup';
import { Pagination } from '../../../../layout/pagination/pagination';
import { TableToolbar } from '../../../../components/toolbars/table-toolbar/table-toolbar';

@Component({
  selector: 'app-confirmed-reservations-component',
  imports: [Pagination, TableByStatus, TableToolbar],
  templateUrl: './confirmed-reservations-component.html',
  styleUrl: './confirmed-reservations-component.css',
})
export class ConfirmedReservationsComponent {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);

  ngOnInit(): void {
    this.store.statusForAdminPage.set(ReservationStatus.CONFIRMED);
    this.facade.getReservationsByStatus(ReservationStatus.CONFIRMED);
  }
}
