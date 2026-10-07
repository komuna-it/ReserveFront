import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarComponent } from '../../components/calendar/calendar';
import { ReservationDetailsModal } from '../../modals/reservation-details-modal/reservation-details-modal';
import { ReservationStore } from '../../services/reservation/reservation.store';
import { ReservationFacade } from '../../services/reservation/reservation.facade';
import { UnauthenticatedModal } from '../../components/modals/unauthenticated-modal/unauthenticated-modal';
import { ViewController } from '../../services/view/view.controller';
import { ViewStore } from '../../services/view/view.store';

@Component({
  selector: 'calendar-page',
  standalone: true,
  imports: [
    CalendarComponent,
    CommonModule,
    FormsModule,
    ReservationDetailsModal,
    UnauthenticatedModal,
  ],
  templateUrl: './calendar.html',
})
export class CalendarPage {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);
}
