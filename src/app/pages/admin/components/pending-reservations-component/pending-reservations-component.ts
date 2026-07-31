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
import { ReservationPopup } from '../../popups/reservationPopup/reservationPopup';
import { ConfirmAction } from '../table-by-status/confirm-action/confirm-action';
import { AdminPage } from '../../admin';
import { TableByStatus } from '../table-by-status/table-by-status';

@Component({
  selector: 'app-pending-reservations-component',
  imports: [ReservationPopup, ConfirmAction, TranslocoPipe, TableByStatus],
  templateUrl: './pending-reservations-component.html',
  styleUrl: './pending-reservations-component.css',
})
export class PendingReservationsComponent implements OnInit {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);
  readonly translocoService = inject(TranslocoService);
  readonly calendarHelper = inject(CalendarHelper);
  readonly parent = inject(AdminPage);

  ngOnInit(): void {
    this.store.statusForAdminPage.set(ReservationStatus.CREATED);
    this.facade.getReservationsByStatus(ReservationStatus.CREATED);
  }
}
