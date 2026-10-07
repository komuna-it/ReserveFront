import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/authService';
import { ReservationDto } from '../../model/reservationDto';
import { ReservationFacade } from '../../services/reservation/reservation.facade';
import { ReservationStore } from '../../services/reservation/reservation.store';
import { OrganizationFacade } from '../../services/organization/organization.facade';
import { OrganizationStore } from '../../services/organization/organization.store';
import { UserStore } from '../../services/user/user.store';
import { UserFacade } from '../../services/user/user.facade';
import { CalendarHelper } from '../../components/calendar/calendar.helper';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextFormatingTool } from '../../tools/textFormatingTool';
import { ConfirmationPopup } from '../../modals/confirmation-popup/confirmation-popup';
import { AddOrganizationModal } from '../../components/modals/add-organization-modal/add-organization-modal';
import { SuccessPopup } from '../../modals/success-popup/success-popup';
import { UserSidebar } from '../../layout/user-sidebar/user-sidebar';
import { RouterOutlet } from '@angular/router';
import { AddUserIntoOrganizationModal } from '../../components/modals/add-user-into-organization-modal/add-user-into-organization-modal';
import { OrganizationDetailsModal } from '../../modals/organization-details-modal/organization-details-modal';
import { SettingsFacade } from '../../settings/settingsFacade';
import { SettingsStore } from '../../settings/settingsStore';
import { ReservationDetailsModal } from '../../modals/reservation-details-modal/reservation-details-modal';
import { ToolbarType } from '../../components/toolbars/toolbarType';
import { ViewStore } from '../../services/view/view.store';
import { ViewController } from '../../services/view/view.controller';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TranslocoPipe,
    ConfirmationPopup,
    UserSidebar,
    OrganizationDetailsModal,
    AddUserIntoOrganizationModal,
    AddOrganizationModal,
    SuccessPopup,
    ReservationDetailsModal,
  ],
  templateUrl: './profile.html',
})
export class ProfilePage implements OnInit, OnDestroy {
  readonly reservationStore = inject(ReservationStore);
  readonly orgStore = inject(OrganizationStore);
  readonly userStore = inject(UserStore);
  readonly settingsStore = inject(SettingsStore);
  readonly viewStore = inject(ViewStore);

  readonly reservationFacade = inject(ReservationFacade);
  readonly orgFacade = inject(OrganizationFacade);
  readonly userFacade = inject(UserFacade);
  readonly settingsFacade = inject(SettingsFacade);
  readonly viewController = inject(ViewController);

  readonly authService = inject(AuthService);
  readonly translocoService = inject(TranslocoService);
  readonly helper = inject(CalendarHelper);
  readonly textFormatingTool = inject(TextFormatingTool);

  readonly reservationToDelete = signal<ReservationDto | null>(null);

  getTitleText(): string {
    if (this.viewStore.confirmMarkReservationAsRequestCancel()) {
      return this.translocoService.translate('USER_MODALS.CONFIRM_REQUEST_CANCEL_TITLE');
    }
    if (this.viewStore.isAddOrganizationModalActive()) {
      return this.translocoService.translate('USER_MODALS.ORGANIZATION_ADDED');
    }
    return '';
  }

  ngOnInit(): void {
    this.reservationStore.toolbarType.set(ToolbarType.USER_ORGANIZATIONS);
    const user = this.authService.currentUser();
    if (user) {
      this.reservationFacade.getRooms();
      this.reservationFacade.getReservations({
        future: this.reservationStore.toolbarOnlyFuture(),
        userId: user.id,
      });
      this.reservationFacade.connectToReservationStream();
      this.orgFacade.getOrganizations(true, user.id);
    }
  }

  handleClickCreateTeam(): void {
    this.viewStore.isAddOrganizationModalActive.set(true);
  }

  ngOnDestroy(): void {
    this.reservationFacade.disconnectStream();
  }
}
