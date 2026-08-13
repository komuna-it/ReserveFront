import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/authService';
import { ReservationDto } from '../../model/reservationDto';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { CalendarHelper } from '../../components/calendar/calendar.helper';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextFormatingTool } from '../../tools/textFormatingTool';
import { ConfirmationPopup } from '../../modals/confirmation-popup/confirmation-popup';
import { AddOrganizationModal } from '../../components/modals/add-organization-modal/add-organization-modal';
import { ReservationStatus } from '../../model/reservationStatus';
import { SuccessPopup } from '../../modals/success-popup/success-popup';
import { UserSidebar } from '../../layout/user-sidebar/user-sidebar';
import { RouterOutlet } from '@angular/router';
import { AddUserIntoOrganizationModal } from '../../components/modals/add-user-into-organization-modal/add-user-into-organization-modal';
import { OrganizationDetailsModal } from '../../modals/organization-details-modal/organization-details-modal';
import { ErrorPopup } from '../../modals/error-popup/error-popup';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TranslocoPipe,
    ConfirmationPopup,
    AddOrganizationModal,
    SuccessPopup,
    UserSidebar,
    OrganizationDetailsModal,
    AddUserIntoOrganizationModal,
    AddOrganizationModal,
    SuccessPopup,
    ErrorPopup,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit, OnDestroy {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);
  readonly translocoService = inject(TranslocoService);
  readonly helper = inject(CalendarHelper);
  readonly textFormatingTool = inject(TextFormatingTool);

  readonly reservationToDelete = signal<ReservationDto | null>(null);
  private sseController: AbortController | null = null;

  constructor() {
    this.authService.checkCurrentSession().subscribe();
  }

  getTitleText(): string {
    if (this.store.confirmMarkReservationAsRequestCancel()) {
      return this.translocoService.translate('USER_MODALS.CONFIRM_REQUEST_CANCEL_TITLE');
    }
    if (this.store.isAddOrganizationModalActive()) {
      return this.translocoService.translate('USER_MODALS.ORGANIZATION_ADDED');
    }
    return '';
  }

  getBodyText(): string {
    if (this.store.isAddOrganizationModalActive()) {
      return '';
    }
    const res = this.store.selectedReservation();
    if (!res) return '';

    const params = {
      organization: this.textFormatingTool.bandText(res),
      date: this.textFormatingTool.dateColumnText(res),
      startHour: this.textFormatingTool.startAtText(res),
      endHour: this.textFormatingTool.endAtText(res),
    };

    if (this.store.confirmMarkReservationAsRequestCancel()) {
      return this.translocoService.translate('USER_MODALS.CONFIRM_REQUEST_CANCEL_BODY', params);
    }

    return '';
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.facade.getRooms();
      this.facade.getAllReservationsForUserAndTheirOrganization();
      this.facade.connectToReservationStream();
      this.facade.getOrganizationsOfUser(true, user.id);
    }
  }

  handleClickCreateTeam(): void {
    this.store.isAddOrganizationModalActive.set(true);
  }

  ngOnDestroy(): void {
    if (this.sseController) {
      this.sseController.abort();
    }
  }

  openRequestCancellation(res: ReservationDto): void {
    this.facade.openConfirmationUpdateReservationsStatus(
      [res],
      ReservationStatus.REQUESTED_CANCELLATION,
    );
  }
}
