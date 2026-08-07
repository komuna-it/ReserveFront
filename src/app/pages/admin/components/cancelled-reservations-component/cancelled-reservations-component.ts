import { Component, inject, OnInit } from '@angular/core';
import { Pagination } from '../../../../layout/pagination/pagination';
import { TableByStatus } from '../table-by-status/table-by-status';
import { TableToolbar } from '../../../../components/toolbars/table-toolbar/table-toolbar';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { AuthService } from '../../../../auth/authService';
import { ReservationStatus } from '../../../../model/reservationStatus';
import { ToolbarType } from '../../../../components/toolbars/toolbarType';

@Component({
  selector: 'app-cancelled-reservations-component',
  standalone: true,
  imports: [Pagination, TableByStatus, TableToolbar], // usunięto zduplikowany Pagination
  templateUrl: './cancelled-reservations-component.html',
  styleUrl: './cancelled-reservations-component.css',
})
export class CancelledReservationsComponent implements OnInit {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);

  readonly toolbarType = ToolbarType.RESERVATION_BY_STATUS;

  ngOnInit(): void {
    this.store.statusForAdminPage.set(ReservationStatus.CANCELLED);
    this.facade.getReservationsByStatus(ReservationStatus.CANCELLED);
  }
}
