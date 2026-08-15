import { Component, inject, input, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { ReservationStatus } from '../../model/reservationStatus';
import { TextFormatingTool } from '../../tools/textFormatingTool';

import { AdminSidebar } from '../../layout/admin-sidebar/admin-sidebar';
import { ConfirmationPopup } from '../../modals/confirmation-popup/confirmation-popup';
import { ErrorPopup } from '../../modals/error-popup/error-popup';
import { BanModal } from '../../modals/ban-modal/ban-modal';
import { SuccessPopup } from '../../modals/success-popup/success-popup';
import { UserDetailsModal } from '../../modals/user-details-modal/user-details-modal';
import { OrganizationDetailsModal } from '../../modals/organization-details-modal/organization-details-modal';
import { AddUserIntoOrganizationModal } from '../../components/modals/add-user-into-organization-modal/add-user-into-organization-modal';
import { AddOrganizationModal } from '../../components/modals/add-organization-modal/add-organization-modal';
import { AddRoomModal } from '../../modals/add-room-modal/add-room-modal';
import { AuthService } from '../../auth/authService';

@Component({
  selector: 'app-admin',
  imports: [
    UserDetailsModal,
    ConfirmationPopup,
    SuccessPopup,
    RouterOutlet,
    AdminSidebar,
    TranslocoPipe,
    ErrorPopup,
    BanModal,
    OrganizationDetailsModal,
    AddUserIntoOrganizationModal,
    AddOrganizationModal,
    AddRoomModal,
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly translocoService = inject(TranslocoService);
  readonly textFormatingTool = inject(TextFormatingTool);
  readonly ReservationStatus = ReservationStatus;
  readonly reservation = input<any | null>(null);

  ngOnInit(): void {
    this.facade.getReservationsByStatus(ReservationStatus.CREATED);
    this.facade.getAllUsers();
  }

  getTitleText(): string {
    if (this.store.confirmMarkReservationAsAccepted()) {
      return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_ACCEPT_TITLE');
    } else if (this.store.confirmMarkReservationAsRequestCancel()) {
      return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_REQUEST_CANCEL_TITLE');
    } else if (this.store.confirmMarkReservationAsCanceled()) {
      return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_CANCEL_TITLE');
    }
    return '';
  }

  getBodyText(): string {
    const res = this.store.selectedReservation();
    if (!res) return '';

    const params = {
      organization: this.textFormatingTool.bandText(res),
      date: this.textFormatingTool.dateColumnText(res),
      startHour: this.textFormatingTool.startAtText(res),
      endHour: this.textFormatingTool.endAtText(res),
    };

    if (this.store.confirmMarkReservationAsAccepted()) {
      return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_ACCEPT_BODY', params);
    } else if (this.store.confirmMarkReservationAsRequestCancel()) {
      return this.translocoService.translate(
        'ADMIN_RESERVATIONS.CONFIRM_REQUEST_CANCEL_BODY',
        params,
      );
    } else if (this.store.confirmMarkReservationAsCanceled()) {
      return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_CANCEL_BODY', params);
    }

    return '';
  }
}
