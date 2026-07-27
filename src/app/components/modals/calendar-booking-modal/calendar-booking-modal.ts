import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CalendarHelper } from '../../calendar/calendar.helper';
import { AuthService } from '../../../auth/authService';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { ReservationStore } from '../../reservation/reservation.store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calendar-booking-modal',
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './calendar-booking-modal.html',
  styleUrl: './calendar-booking-modal.css',
})
export class CalendarBookingModal {
  translocoService = inject(TranslocoService);
  readonly helper = inject(CalendarHelper);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);
}
