import { Component, computed, inject, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { AuthService } from '../../auth/authService';
import { ReservationStore } from '../reservation/reservation.store';
import { TranslocoPipe } from '@jsverse/transloco';
import { Room } from '../../model/room';
import { CalendarReservation } from '../calendar-reservation/calendar-reservation';

@Component({
  selector: 'app-calendar-hour',
  imports: [NgClass],
  templateUrl: './calendar-hour.html',
  styleUrl: './calendar-hour.css',
})
export class CalendarHour {
 
  readonly date = input.required<Date>();
  readonly room = input.required<Room>();
  readonly reservation = input<CalendarReservation>();

  readonly authService = inject(AuthService);
  readonly store = inject(ReservationStore);

  readonly isForAdmin = input<boolean | null>(false);
  readonly isMyPrivate = input<boolean | null>(false);
  readonly isMyOrganization = input<boolean | null>(false);
  readonly isFirstHourOfReservation = input<boolean | null>(false);
  readonly isLastHourOfReservation = input<boolean | null>(false);
  readonly isDisabled = input<boolean | null>(false);
  readonly isReserved = input<boolean | null>(false);

}
