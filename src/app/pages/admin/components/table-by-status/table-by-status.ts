import { Component, computed, inject, input, OnInit } from '@angular/core';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AdminPage } from '../../admin';
import { PendingReservationsComponent } from '../pending-reservations-component/pending-reservations-component';
import { ReservationStatus } from '../../../../model/reservationStatus';
import { ReservationDto } from '../../../../model/reservationDto';
import { TextFormatingTool } from '../../../../tools/textFormatingTool';
import { ConfirmationPopup } from '../../../../modals/confirmation-popup/confirmation-popup';
import { SuccessPopup } from '../../../../modals/success-popup/success-popup';
import { ErrorPopup } from '../../../../modals/error-popup/error-popup';

@Component({
  selector: 'app-table-by-status',
  imports: [TranslocoPipe],
  templateUrl: './table-by-status.html',
  styleUrl: './table-by-status.css',
})
export class TableByStatus {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly parent = inject(AdminPage);
  readonly status = input<any | null>();
  readonly translocoService = inject(TranslocoService);
  readonly textFormatingTool = inject(TextFormatingTool);

  getAcceptText(): string {
    switch (this.store.statusForAdminPage()) {
      case ReservationStatus.CREATED: {
        return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_ACCEPT');
      }
      case ReservationStatus.CANCELLED: {
        return this.translocoService.translate('ADMIN_CANCELLED_RESERVATIONS.CONFIRM_ACCEPT');
      }
      case ReservationStatus.CONFIRMED: {
        return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_ACCEPT');
      }
      case ReservationStatus.REJECTED_CANCELLATION: {
        return this.translocoService.translate(
          'ADMIN_REJECTED_CANCELLATION_RESERVATIONS.CONFIRM_ACCEPT',
        );
      }
      case ReservationStatus.REQUESTED_CANCELLATION: {
        return this.translocoService.translate(
          'ADMIN_REQUESTED_CANCELLATION_RESERVATIONS.CONFIRM_ACCEPT',
        );
      }
      default: {
        return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_ACCEPT_BUTTON');
      }
    }
    return 'OK';
  }

  getCancelText(): string {
    switch (this.store.statusForAdminPage()) {
      case ReservationStatus.CREATED: {
        return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_REJECT_BUTTON');
      }
      case ReservationStatus.CANCELLED: {
        return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_CANCEL_BUTTON');
      }
      case ReservationStatus.CONFIRMED: {
        return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_CANCEL_BUTTON');
      }
      case ReservationStatus.REJECTED_CANCELLATION: {
        return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_CANCEL_BUTTON');
      }
      case ReservationStatus.REQUESTED_CANCELLATION: {
        return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_CANCEL_BUTTON');
      }
      default: {
        return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_CANCEL_BUTTON');
      }
    }
    return 'Cancel';
  }

  handleAcceptClick(res: ReservationDto) {
    switch (this.store.statusForAdminPage()) {
      case ReservationStatus.CREATED: {
        this.facade.handleAcceptReservation(res);
        break;
      }
      case ReservationStatus.CANCELLED: {
        return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_CANCEL_BUTTON');
        break;
      }
      case ReservationStatus.CONFIRMED: {
        return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_CANCEL_BUTTON');
        break;
      }
      case ReservationStatus.REJECTED_CANCELLATION: {
        return this.translocoService.translate(
          'ADMIN_REJECTED_CANCELLATION_RESERVATIONS.CONFIRM_CANCEL_BUTTON',
        );
        break;
      }
      case ReservationStatus.REQUESTED_CANCELLATION: {
        return this.translocoService.translate(
          'ADMIN_REQUESTED_CANCELLATION_RESERVATIONS.CONFIRM_CANCEL_BUTTON',
        );
        break;
      }
      default: {
        ('Accept');
      }
    }
    return 'Accept';
  }

  handleCancelClick(res: ReservationDto) {
    switch (this.store.statusForAdminPage()) {
      case ReservationStatus.CREATED: {
        this.facade.handleCancelReservation(res);
        break;
      }
      case ReservationStatus.CANCELLED: {
        this.facade.handleCancelReservation(res);
        break;
      }
      case ReservationStatus.CONFIRMED: {
        this.facade.handleCancelReservation(res);
        break;
      }
      case ReservationStatus.REJECTED_CANCELLATION: {
        this.facade.handleCancelReservation(res);
        break;
      }
      case ReservationStatus.REQUESTED_CANCELLATION: {
        this.facade.handleCancelReservation(res);
        break;
      }
      default: {
        ('Cancel');
      }
    }
    return 'Cancel';
  }

  isAcceptButtonVisible(): boolean {
    switch (this.store.statusForAdminPage()) {
      case ReservationStatus.CREATED: {
        return true;
      }
      case ReservationStatus.CANCELLED: {
        return false;
      }
      case ReservationStatus.CONFIRMED: {
        return false;
      }
      case ReservationStatus.REQUESTED_CANCELLATION: {
        return false;
      }
      default: {
        return false;
      }
    }
  }
}
