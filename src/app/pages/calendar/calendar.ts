import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarComponent } from '../../components/calendar/calendar';
import { ReservationDetailsModal } from '../../modals/reservation-details-modal/reservation-details-modal';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';

@Component({
  selector: 'calendar-page',
  standalone: true,
  imports: [CalendarComponent, CommonModule, FormsModule, ReservationDetailsModal],
  templateUrl: './calendar.html',
})
export class CalendarPage {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
}
