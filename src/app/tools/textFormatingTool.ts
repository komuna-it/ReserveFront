import { inject, Injectable } from '@angular/core';
import { ReservationDto } from '../model/reservationDto';
import { TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../components/reservation/reservation.store';
import { CalendarHelper } from '../components/calendar/calendar.helper';

@Injectable({ providedIn: 'root' })
export class TextFormatingTool {
  readonly translocoService = inject(TranslocoService);
  readonly store = inject(ReservationStore);
  readonly calendarHelper = inject(CalendarHelper);

  // reservation modals & popups texts

  bandText(res: ReservationDto): string {
    return (
      this.store.allOrganizations().find((o) => o.id === res.organization)?.name ?? 'brak nazwy'
    );
  }

  reservedByText(res: ReservationDto): string {
    return this.store.allUsers().find((u) => u.id === res.reservedBy)?.nick ?? 'brak nicku';
  }

  dateColumnText(res: ReservationDto): string {
    return this.calendarHelper.generateDayLabel(res.startAt);
  }

  startAtText(res: ReservationDto) {
    return this.calendarHelper.generateHourLabel(res.startAt);
  }

  endAtText(res: ReservationDto) {
    return this.calendarHelper.generateHourLabel(res.endAt);
  }

  privateReservationText(res: ReservationDto) {
    return res.organization === null
      ? this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.IS_PRIVATE')
      : this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.IS_NOT_PRIVATE');
  }
}
