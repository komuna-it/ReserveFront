import { Component, inject, input, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { ReservationStore } from '../../services/reservation/reservation.store';
import { ReservationFacade } from '../../services/reservation/reservation.facade';
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
import { ReservationDetailsModal } from '../../modals/reservation-details-modal/reservation-details-modal';
import { OrganizationFacade } from '../../services/organization/organization.facade';
import { UserFacade } from '../../services/user/user.facade';
import { UserStore } from '../../services/user/user.store';
import { OrganizationStore } from '../../services/organization/organization.store';
import { ViewController } from '../../services/view/view.controller';
import { ViewStore } from '../../services/view/view.store';

@Component({
  selector: 'app-admin',
  imports: [
    UserDetailsModal,
    ConfirmationPopup,
    SuccessPopup,
    RouterOutlet,
    AdminSidebar,
    TranslocoPipe,
    BanModal,
    OrganizationDetailsModal,
    AddUserIntoOrganizationModal,
    AddOrganizationModal,
    AddRoomModal,
    ReservationDetailsModal,
  ],
  templateUrl: './admin.html',
})
export class AdminPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly reservationStore = inject(ReservationStore);
  readonly organizationStore = inject(OrganizationStore);
  readonly userStore = inject(UserStore);
  readonly facade = inject(ReservationFacade);
  readonly organizationFacade = inject(OrganizationFacade);
  readonly userFacade = inject(UserFacade);
  readonly translocoService = inject(TranslocoService);
  readonly textFormatingTool = inject(TextFormatingTool);
  readonly ReservationStatus = ReservationStatus;
  readonly reservation = input<any | null>(null);
  readonly tool = inject(TextFormatingTool);
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);

  ngOnInit(): void {
    this.facade.getReservations({
      statuses: new Set<ReservationStatus>([ReservationStatus.CREATED]),
      future: this.reservationStore.toolbarOnlyFuture(),
    });
    this.userFacade.getAllUsers();
  }

  getTitleText(): string {
    if (this.viewStore.confirmMarkReservationAsAccepted()) {
      return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_ACCEPT_TITLE');
    } else if (this.viewStore.confirmMarkReservationAsRequestCancel()) {
      return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_REQUEST_CANCEL_TITLE');
    } else if (this.viewStore.confirmMarkReservationAsCanceled()) {
      return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_CANCEL_TITLE');
    }
    return '';
  }

  getBodyText(): string {
    const res = this.reservationStore.selectedReservation();
    if (!res) return '';

    const params = {
      organization: this.textFormatingTool.bandText(res),
      date: this.textFormatingTool.dateColumnText(res),
      startHour: this.textFormatingTool.startAtText(res),
      endHour: this.textFormatingTool.endAtText(res),
    };

    if (this.viewStore.confirmMarkReservationAsAccepted()) {
      return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_ACCEPT_BODY', params);
    } else if (this.viewStore.confirmMarkReservationAsRequestCancel()) {
      return this.translocoService.translate(
        'ADMIN_RESERVATIONS.CONFIRM_REQUEST_CANCEL_BODY',
        params,
      );
    } else if (this.viewStore.confirmMarkReservationAsCanceled()) {
      return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_CANCEL_BODY', params);
    }

    return '';
  }
}
