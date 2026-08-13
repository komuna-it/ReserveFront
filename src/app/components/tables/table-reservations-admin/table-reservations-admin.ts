import { Component, effect, inject, input } from '@angular/core';
import { ReservationStatus } from '../../../model/reservationStatus';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { ReservationStore } from '../../reservation/reservation.store';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextFormatingTool } from '../../../tools/textFormatingTool';
import { CalendarHelper } from '../../calendar/calendar.helper';
import { CommonModule } from '@angular/common';
import { Organization } from '../../../model/organization';
import { Pagination } from '../../../layout/pagination/pagination';

@Component({
  selector: 'app-table-reservations-admin',
  imports: [TranslocoPipe, CommonModule, Pagination],
  standalone: true,
  templateUrl: './table-reservations-admin.html',
  styleUrl: './table-reservations-admin.css',
})
export class TableReservationsAdmin {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly translocoService = inject(TranslocoService);
  readonly textFormatingTool = inject(TextFormatingTool);
  readonly calendarHelper = inject(CalendarHelper);
  readonly ReservationStatus = ReservationStatus;

  constructor() {
    effect(() => {
      this.facade.getReservationsForOrganization();
    });
  }
}
