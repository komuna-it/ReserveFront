import { inject, Injectable } from '@angular/core';
import { ReservationDto } from '../model/reservationDto';
import { TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../components/reservation/reservation.store';
import { CalendarHelper } from '../components/calendar/calendar.helper';
import { ReservationFacade } from '../components/reservation/reservation.facade';
import { ReservationStatus } from '../model/reservationStatus';
import { User } from '../model/user';
import { AuthService } from '../auth/authService';
import { Organization } from '../model/organization';

@Injectable({ providedIn: 'root' })
export class TextFormatingTool {
  readonly translocoService = inject(TranslocoService);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly calendarHelper = inject(CalendarHelper);
  readonly authService = inject(AuthService);
  readonly loco = inject(TranslocoService);

  // reservation modals & popups texts

  constructor() {
    this.facade.getRooms();
    this.facade.getAllUsers();
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
    console.log('loaded orgs');
    console.table(this.store.organizations());

    console.log('loaded res');
    console.table(this.store.reservations());

    // 0. NIEZALOGOWANY → NIC NIE WIDZI
    const currentUser = this.authService.currentUser();
    if (!currentUser) return 'no user';

    // 1. ORGANIZACJE → nazwa organizacji
    if (res.organization != null) {
      const orgs = this.store.organizations();
      const foundOrg = orgs.find((org) => Number(org.id) === Number(res.organization));
      return foundOrg?.name || 'no org';
    }

    // 2. PRYWATNE
    const privateText = this.loco.translate('CALENDAR.PRIVATE') || 'prywatna';
    const myPrivateText = this.loco.translate('CALENDAR.MY_PRIVATE') || 'Moja prywatna';

    // 3. NICK ZAWSZE ZE STORE.ALLUSERS()
    const users = this.store.users();
    const reservedByUser = users.find((u) => u.id === res.reservedBy);
    const nick = reservedByUser?.nick || 'No nick found';

    const currentUserId = currentUser.id;

    // 4. ADMIN → zawsze widzi nick + (prywatna)
    if (this.authService.isAdmin()) {
      console.log(
        'resId: ',
        res.id,
        'nick ? ',
        nick,
        ' reservedByUser ',
        reservedByUser?.id,
        ' res.reservedBy ',
        res.reservedBy,
      );
      console.log('8 === res.reservedBy: ', 8 === res.reservedBy);
      return nick ? `${nick} (${privateText})` : `(${privateText})`;
    }

    // 5. ZALOGOWANY USER → widzi tylko swoje lub swojej organizacji
    const userOrgs = this.store.organizations().map((o) => o.id);

    const isMyReservation = currentUserId === res.reservedBy;
    const isMyTeamReservation = userOrgs.includes(res.organization ?? -1);

    if (isMyReservation) return myPrivateText;
    if (isMyTeamReservation) return nick ? `${nick} (${privateText})` : `(${privateText})`;

    // 6. INNE PRYWATNE → NIC
    return 'others';
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
    return room?.name ?? '';
  }

  getPrice(res: ReservationDto): string {
    return `${res.price}`;
  }

  formatDuration(res: ReservationDto): string {
    return this.calendarHelper.generateDurationLabel(res.startAt, res.duration);
  }

  reservedByLabel(reservation: ReservationDto): string {
    const org = this.store.userOrganizations().find((o) => o.id === reservation.organization);

    return org ? `${org.name}` : this.translocoService.translate('USER_MODALS.PRIVATE');
  }

  getStatusText(res: ReservationDto): string {
    switch (res.status) {
      case ReservationStatus.CREATED:
        return this.translocoService.translate('STATUS.CREATED');
      case ReservationStatus.CONFIRMED:
        return this.translocoService.translate('STATUS.CONFIRMED');
      case ReservationStatus.CANCELLED:
        return this.translocoService.translate('STATUS.CANCELLED');
      case ReservationStatus.REQUESTED_CANCELLATION:
        return this.translocoService.translate('STATUS.REQUESTED_CANCELLATION');
      case ReservationStatus.REJECTED:
        return this.translocoService.translate('STATUS.REJECTED');
      default:
        return '';
    }
  }

  getIsUserBannedText(user: User) {
    return user.banDto
      ? this.translocoService.translate('USERS_TABLE.YES')
      : this.translocoService.translate('USERS_TABLE.NO');
  }

  getIsUserTrustedText(user: User) {
    return user.banDto
      ? this.translocoService.translate('USERS_TABLE.YES')
      : this.translocoService.translate('USERS_TABLE.NO');
  }
}
