import { Component, computed, inject, input, OnInit } from '@angular/core';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { AuthService } from '../../../../auth/authService';
import { ReservationStatus } from '../../../../model/reservationStatus';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Organization } from '../../../../model/organization';
import { filter } from 'rxjs';
import { ReservationDto } from '../../../../model/reservationDto';
import { CalendarHelper } from '../../../../components/calendar/calendar.helper';
import { AdminPage } from '../../admin';
import { TableByStatus } from '../table-by-status/table-by-status';
import { ConfirmationPopup } from '../../../../modals/confirmation-popup/confirmation-popup';
import { Pagination } from '../../../../layout/pagination/pagination';
import { ToolbarType } from '../../../../components/toolbars/toolbarType';
import { TableToolbar } from '../../../../components/toolbars/table-toolbar/table-toolbar';

@Component({
  selector: 'app-pending-reservations-component',
  templateUrl: './pending-reservations-component.html',
  imports: [TableByStatus, Pagination, TableToolbar],

  styleUrl: './pending-reservations-component.css',
})
export class PendingReservationsComponent implements OnInit {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.store.statusForAdminPage.set(ReservationStatus.CREATED);
    this.facade.getReservationsByStatus(ReservationStatus.CREATED);
  }
  readonly toolbarType = ToolbarType.RESERVATION_BY_STATUS;
}
