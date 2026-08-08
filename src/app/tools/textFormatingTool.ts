import { inject, Injectable } from '@angular/core';
import { ReservationDto } from '../model/reservationDto';
import { TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../components/reservation/reservation.store';
import { CalendarHelper } from '../components/calendar/calendar.helper';
import { ReservationFacade } from '../components/reservation/reservation.facade';

@Injectable({ providedIn: 'root' })
export class TextFormatingTool {
  readonly translocoService = inject(TranslocoService);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly calendarHelper = inject(CalendarHelper);

  // reservation modals & popups texts

  constructor() {
    this.facade.getRooms();
  }

  bandText(res: ReservationDto): string {
    {
      return (
        this.store.allOrganizations().find((o) => o.id === res.organization)?.name ??
        this.translocoService.translate('USER_MODALS.PRIVATE')
      );
    }
  }

  reservedByText(res: ReservationDto): string {
    const privateText = this.translocoService.translate('USER_MODALS.PRIVATE');
    const userText = `${res.reservedByText} (${privateText})`;

    if (res.organization) return res.reservedByText;

    return userText;
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
      ? this.translocoService.translate('ADMIN_RESERVATIONS.IS_PRIVATE')
      : this.translocoService.translate('ADMIN_RESERVATIONS.IS_NOT_PRIVATE');
  }

  getRoomName(res: ReservationDto): string {
    const room = this.store.rooms().find((r) => r.id === res.room);
    console.log('rooms:');
    console.table(room);
    return room?.name ?? '';
  }

  getPrice(res: ReservationDto): string {
    return 'brak';
  }
}
