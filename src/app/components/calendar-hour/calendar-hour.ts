import { Component, computed, inject, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { AuthService } from '../../auth/authService';
import { ReservationStore } from '../reservation/reservation.store';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { Room } from '../../model/room';
import { ReservationDto } from '../../model/reservationDto';
import { TextFormatingTool } from '../../tools/textFormatingTool';

@Component({
  selector: 'app-calendar-hour',
  standalone: true,
  imports: [NgClass, TranslocoModule],
  templateUrl: './calendar-hour.html',
  styleUrl: './calendar-hour.css',
  host: { class: 'block h-full w-full' },
})
export class CalendarHour {
  readonly authService = inject(AuthService);
  readonly store = inject(ReservationStore);
  readonly loco = inject(TranslocoService);
  readonly tool = inject(TextFormatingTool);

  readonly date = input.required<Date>();
  readonly room = input.required<Room>();
  readonly hour = input.required<number>();
  readonly reservation = input<ReservationDto | undefined>();

  readonly isForAdmin = input<boolean | null>(false);
  readonly isMyPrivate = input<boolean | null>(false);
  readonly isMyOrganization = input<boolean | null>(false);
  readonly isFirstHourOfReservation = input<boolean | null>(false);
  readonly isLastHourOfReservation = input<boolean | null>(false);
  readonly isPast = input<boolean | null>(false);
  readonly isReserved = input<boolean | null>(false);

  readonly slotClick = output<void>();

  readonly canViewDetails = computed(() => {
    if (!this.isReserved()) return false;
    if (this.authService.isAdmin()) return true;
    return Boolean(this.isMyPrivate() || this.isMyOrganization());
  });

  readonly cellClasses = computed(() => {
    if (this.isPast()) {
      return 'bg-slate-800/20 text-slate-600 cursor-not-allowed opacity-50 h-full';
    }

    if (!this.isReserved()) {
      return 'h-full';
    }

    const isFirst = Boolean(this.isFirstHourOfReservation());
    const isLast = Boolean(this.isLastHourOfReservation());

    let shapeClasses = '';
    let borderClasses = '';

    if (isFirst && isLast) {
      shapeClasses = 'rounded-xl h-[calc(100%-4px)]  ';
      borderClasses = 'border';
    } else if (isFirst && !isLast) {
      shapeClasses = 'rounded-t-xl h-[calc(100%-2px)] ';
      borderClasses = 'border-t border-x border-b-0';
    } else if (!isFirst && isLast) {
      shapeClasses = 'rounded-b-xl h-[calc(100%-2px)] mb-0.5 mt-0';
      borderClasses = 'border-b border-x border-t-0';
    } else {
      shapeClasses = 'rounded-none h-full my-0';
      borderClasses = 'border-x border-t-0 border-b-0';
    }

    if (this.canViewDetails()) {
      return `bg-blue-500/20 text-blue-300 ${borderClasses} border-blue-500/40 hover:bg-blue-500/30 cursor-pointer ${shapeClasses}`;
    }

    return `bg-red-500/20 text-red-300 ${borderClasses} border-red-500/40 cursor-not-allowed ${shapeClasses}`;
  });

  readonly reservationText = computed(() => {
    if (!this.isReserved() || !this.canViewDetails()) return '';

    const res = this.reservation();

    if (res) return this.tool.reservedByText(res);
    return 'Private';
  });

  onCellClick(): void {
    if (this.isPast()) return;

    if (!this.isReserved()) {
      this.slotClick.emit();
    } else if (this.canViewDetails()) {
      this.store.isReservationDetailsModalActive.set(true);
    }
  }
}
