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

@Component({
  selector: 'app-cancelled-reservations-component',
  imports: [Pagination, TableByStatus, Pagination],
  templateUrl: './cancelled-reservations-component.html',
  styleUrl: './cancelled-reservations-component.css',
})
export class CancelledReservationsComponent {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.store.statusForAdminPage.set(ReservationStatus.CANCELLED);
    this.facade.getReservationsByStatus(ReservationStatus.CANCELLED);
  }
}
