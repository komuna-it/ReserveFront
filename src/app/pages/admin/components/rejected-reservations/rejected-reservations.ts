import { Component, inject } from '@angular/core';
import { ReservationStatus } from '../../../../model/reservationStatus';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { TableToolbar } from '../../../../components/toolbars/table-toolbar/table-toolbar';
import { TableByStatus } from '../table-by-status/table-by-status';
import { Pagination } from '../../../../layout/pagination/pagination';

@Component({
  selector: 'app-rejected-reservations',
  imports: [Pagination, TableByStatus],
  templateUrl: './rejected-reservations.html',
  styleUrl: './rejected-reservations.css',
})
export class RejectedReservations {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);

  ngOnInit(): void {
    this.store.statusForAdminPage.set(ReservationStatus.REJECTED);
    this.facade.getReservationsByStatus(ReservationStatus.REJECTED);
  }
}
