import { Component, computed, inject, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { AuthService } from '../../auth/authService';
import { ReservationStore } from '../reservation/reservation.store';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-calendar-hour',
  imports: [NgClass, TranslocoPipe],
  templateUrl: './calendar-hour.html',
  styleUrl: './calendar-hour.css',
})
export class CalendarHour {
  readonly authService = inject(AuthService);
  readonly store = inject(ReservationStore);

  readonly isForAdmin = input<boolean | null>(false);
  readonly isMyPrivate = input<boolean | null>(false);
  readonly isMyOrganization = input<boolean | null>(false);
  readonly isFirstHourOfReservation = input<boolean | null>(false);
  readonly isLastHourOfReservation = input<boolean | null>(false);
  readonly isDisabled = input<boolean | null>(false);
  readonly isReserved = input<boolean | null>(false);
  readonly reservationText = input<string | null>('');
  readonly hour = input<string | number | null>('');

  readonly canViewDetails = computed(() =>
    Boolean(this.isForAdmin() || this.isMyOrganization() || this.isMyPrivate()),
  );

  readonly cellClasses = computed(() => {
    const isFirst = Boolean(this.isFirstHourOfReservation());
    const isLast = Boolean(this.isLastHourOfReservation());
    const hasAccess = this.canViewDetails();

    return {
      'bg-blue-500/20 text-blue-400': hasAccess,
      'bg-red-500/20 text-red-400': !hasAccess,

      'text-blue-400/50 border-blue-500/20': hasAccess && !isFirst && !isLast,
      'text-red-400/40 border-red-500/15': !hasAccess && !isFirst && !isLast,

      'rounded-full border-0': isFirst && isLast,
      'rounded-t-3xl': isFirst && !isLast,
      'rounded-b-3xl': !isFirst && isLast,
    };
  });

  readonly cellFill = computed(() => {
    return { 'border-b border-slate-700/50': !this.isReserved() };
  });
}
