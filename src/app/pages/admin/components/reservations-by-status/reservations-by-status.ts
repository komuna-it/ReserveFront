import { Component, effect, inject, input, OnInit } from '@angular/core';
import { Pagination } from '../../../../layout/pagination/pagination';
import { TableToolbar } from '../../../../components/toolbars/table-toolbar/table-toolbar';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { AuthService } from '../../../../auth/authService';
import { ReservationStatus } from '../../../../model/reservationStatus';
import { ToolbarType } from '../../../../components/toolbars/toolbarType';
import { TableReservations } from '../../../../components/tables/table-reservations/table-reservations';
import { ReservationTableType } from '../../../../model/reservationTableType';

@Component({
  selector: 'app-reservations-by-status',
  imports: [TableToolbar, TableReservations],
  templateUrl: './reservations-by-status.html',
  styleUrl: './reservations-by-status.css',
})
export class ReservationsByStatus {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);
  readonly status = input.required<ReservationStatus>();
  readonly resTableType = ReservationTableType.ADMIN_BY_STATUS;

  readonly toolbarType = ToolbarType.RESERVATION_BY_STATUS;

  constructor() {
    effect(() => {
      const currentStatus = this.status();
      this.store.statusForAdminPage.set(currentStatus);
      this.facade.getReservationsByStatus(currentStatus);
    });
  }
}
