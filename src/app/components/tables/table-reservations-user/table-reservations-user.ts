import { Component, inject } from '@angular/core';
import { ReservationStatus } from '../../../model/reservationStatus';
import { ReservationDto } from '../../../model/reservationDto';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { ReservationStore } from '../../reservation/reservation.store';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextFormatingTool } from '../../../tools/textFormatingTool';
import { CalendarHelper } from '../../calendar/calendar.helper';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-reservations-user',
  imports: [TranslocoPipe, CommonModule],
  templateUrl: './table-reservations-user.html',
  styleUrl: './table-reservations-user.css',
})
export class TableReservationsUser {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly translocoService = inject(TranslocoService);
  readonly textFormatingTool = inject(TextFormatingTool);
  readonly calendarHelper = inject(CalendarHelper);

  deleteReservation(reservationId: number) {
    console.log(`Trying to delete reservation with id ${reservationId}`);
    this.facade.deleteReservation(reservationId);
    this.facade.getAllReservationsForUserAndTheirOrganization();
  }
  formatDuration(res: ReservationDto): string {
    return this.calendarHelper.generateDurationLabel(res.startAt, res.duration);
  }

  reservedByLabel(reservation: ReservationDto): string {
    const org = this.store.userOrganizations().find((o) => o.id === reservation.organization);

    return org ? `${org.name}` : this.translocoService.translate('USER_MODALS.PRIVATE');
  }
  isCancellationPossible(res: ReservationDto): boolean {
    if (
      res.status === ReservationStatus.CANCELLED ||
      res.status === ReservationStatus.REQUESTED_CANCELLATION
    ) {
      return false;
    }

    const startDate = new Date(res.startAt);
    const now = new Date();
    const timeDifference = startDate.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    return hoursDifference >= 24 || res.status === ReservationStatus.CREATED;
  }

  getCancelButtonLabel(res: ReservationDto): string {
    if (!this.isCancellationPossible(res)) {
      return this.translocoService.translate('PROFILE.CANCEL_BTN_DISABLED');
    }

    switch (res.status) {
      case ReservationStatus.CREATED:
        return this.translocoService.translate('PROFILE.CANCEL_BTN');
      case ReservationStatus.CONFIRMED:
        return this.translocoService.translate('PROFILE.CANCEL_BTN');
      case ReservationStatus.CANCELLED:
        return this.translocoService.translate('PROFILE.CANCEL_BTN');
      case ReservationStatus.REQUESTED_CANCELLATION:
        return this.translocoService.translate('PROFILE.REQUESTED_CANCELLATION_BUTTON');
      default:
        return '';
    }
  }

  getRoomName(res: ReservationDto): string {
    const room = this.store.rooms().find((r) => r.id === res.room);
    return room ? room.name : '';
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
      default:
        return '';
    }
  }
}
