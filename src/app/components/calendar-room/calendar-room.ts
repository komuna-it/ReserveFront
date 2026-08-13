import { CalendarHour } from '../calendar-hour/calendar-hour';
import { Component, computed, inject, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { AuthService } from '../../auth/authService';
import { ReservationStore } from '../reservation/reservation.store';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-calendar-room',
  imports: [],
  templateUrl: './calendar-room.html',
  styleUrl: './calendar-room.css',
})
export class CalendarRoom {
  readonly authService = inject(AuthService);
  readonly store = inject(ReservationStore);

  readonly id = 0;
  readonly name = '';

  readonly hours: CalendarHour[] | null = null;
}
