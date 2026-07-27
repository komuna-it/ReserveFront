import { Component, computed, inject, input, OnInit } from '@angular/core';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { AuthService } from '../../../../auth/authService';
import { ReservationStatus } from '../../../../model/reservationStatus';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Organization } from '../../../../model/organization';
import { filter } from 'rxjs';
import { ReservationDto } from '../../../../model/reservationDto';
import { CalendarHelper } from '../../../../components/calendar/calendar.helper';
import { ReservationAccepted } from '../../popups/reservation-accepted/reservation-accepted';
import { ReservationCanceled } from '../../popups/reservation-canceled/reservation-canceled';
import { ConfirmAction } from '../../modals/confirm-action/confirm-action';

@Component({
  selector: 'app-pending-reservations-component',
  imports: [ReservationAccepted, ReservationCanceled, ConfirmAction, TranslocoPipe],
  templateUrl: './pending-reservations-component.html',
  styleUrl: './pending-reservations-component.css',
})
export class PendingReservationsComponent implements OnInit {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);
  readonly translocoService = inject(TranslocoService);
  readonly calendarHelper = inject(CalendarHelper);
  readonly reservation = input<any | null>;

  ngOnInit() {
    this.facade.getReservationsByStatus(ReservationStatus.CREATED);
    this.facade.getAllUsers();
  }

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

  handleClickAcceptReservation(res: ReservationDto) {
    this.store.confirmMarkReservationAsAccepted.set(true);
    this.store.selectedReservation.set(res);
  }

  handleAcceptReservation(res: ReservationDto) {
    this.facade.markReservationAsAccepted(res.id);
    this.store.confirmMarkReservationAsAccepted.set(false);
    this.store.popupMarkedReservationAsAccepted.set(true);
  }

  handleClickCancelReservation(res: ReservationDto) {
    this.store.confirmMarkReservationAsCanceled.set(true);
    this.store.selectedReservation.set(res);
  }

  handleCancelReservation(res: ReservationDto) {
    this.facade.markReservationAsCanceled(res.id);
    this.store.confirmMarkReservationAsCanceled.set(false);
    this.store.popupMarkedReservationAsCanceled.set(true);
  }

  closeModals() {
    this.store.globalErrorKey.set(null);
    this.store.confirmMarkReservationAsAccepted.set(false);
    this.store.confirmMarkReservationAsRequestCancel.set(false);
    this.store.confirmMarkReservationAsCanceled.set(false);

    this.store.popupMarkedReservationAsAccepted.set(false);
    this.store.popupMarkedReservationAsRequestCancel.set(false);
    this.store.popupMarkedReservationAsCanceled.set(false);
  }
}
