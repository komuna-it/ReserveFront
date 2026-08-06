import { Component, inject, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarHelper } from './calendar.helper';
import { ReservationStore } from '../reservation/reservation.store';
import { ReservationFacade } from '../reservation/reservation.facade';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../auth/authService';
import { CalendarBookingModal } from '../modals/calendar-booking-modal/calendar-booking-modal';
import { CalendarHour } from '../calendar-hour/calendar-hour';
import { SuccessPopup } from '../../modals/success-popup/success-popup';
import { ErrorPopup } from '../../modals/error-popup/error-popup';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    SuccessPopup,
    ErrorPopup,
    CommonModule,
    FormsModule,
    TranslocoPipe,
    CalendarBookingModal,
    CalendarHour,
  ],
  templateUrl: './calendar.html',
})
export class CalendarComponent implements OnInit, OnDestroy {
  translocoService = inject(TranslocoService);
  readonly helper = inject(CalendarHelper);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);

  ngOnInit() {
    this.facade.getRoomsAndReservations();
    this.facade.getAllUsers();

    if (this.authService.userId()) {
      console.error('User id not loaded yet');
      return;
    }

    console.log('Initializing calendar...');
    this.facade.refreshOrganizations();
    this.facade.connectToReservationStream();
  }

  ngOnDestroy() {
    this.facade.disconnectStream();
  }
}
