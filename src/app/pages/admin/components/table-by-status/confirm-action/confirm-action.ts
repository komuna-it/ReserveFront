import { Component, inject, input } from '@angular/core';
import { ReservationStore } from '../../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../../components/reservation/reservation.facade';
import { AuthService } from '../../../../../auth/authService';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PendingReservationsComponent } from '../../pending-reservations-component/pending-reservations-component';
import { ReservationStatus } from '../../../../../model/reservationStatus';
import { AdminPage } from '../../../admin';

@Component({
  selector: 'app-confirm-action',
  imports: [TranslocoPipe],
  templateUrl: './confirm-action.html',
  styleUrl: './confirm-action.css',
})
export class ConfirmAction {
  readonly reservation = input<any | null>(null);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);
  readonly translocoService = inject(TranslocoService);
  readonly parent = inject(AdminPage);
  readonly text: string = '';

  closeModals() {
    this.store.confirmMarkReservationAsAccepted.set(false);
    this.store.confirmMarkReservationAsCanceled.set(false);
  }

  getTitle(): string {
    if (this.store.confirmMarkReservationAsAccepted() === true) {
      return this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.CONFIRM_ACCEPT');
    } else {
      return this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.CONFIRM_CANCEL');
    }
  }

  sendText(): string {
    if (this.store.confirmMarkReservationAsAccepted() === true) {
      return this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.SEND_ACCEPT');
    } else {
      return this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.SEND_CANCEL');
    }
  }

  confirm() {
    if (this.store.confirmMarkReservationAsAccepted() === true) {
      this.facade.markReservationAsAccepted(this.store.selectedReservation()?.id ?? 0);
    } else {
      this.facade.markReservationAsCanceled(this.store.selectedReservation()?.id ?? 0);
    }
    this.facade.getReservationsByStatus(ReservationStatus.CREATED);
    this.closeModals();
  }
}
