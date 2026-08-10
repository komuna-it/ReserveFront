import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
import { TableReservationsUser } from '../../components/tables/table-reservations-user/table-reservations-user';
import { OrganizationMembers } from '../../components/tables/organization-members/organization-members';
import { SuccessPopup } from '../../modals/success-popup/success-popup';
import { UserSidebar } from '../../layout/user-sidebar/user-sidebar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoPipe,
    ConfirmationPopup,
    AddOrganizationModal,
    TableReservationsUser,
    OrganizationMembers,
    SuccessPopup,
    UserSidebar,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);
  readonly translocoService = inject(TranslocoService);
  readonly helper = inject(CalendarHelper);
  readonly reservationToDelete = signal<ReservationDto | null>(null);
  readonly textFormatingTool = inject(TextFormatingTool);
  readonly auth = inject(AuthService);
  private sseController: AbortController | null = null;

  activeOrgsUsers = computed(() => {
    const activeTab = this.store.activeTab();
    if (activeTab.type === 'organization' && activeTab.org) {
      return activeTab.org.members;
    }
    return [];
  });

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

    console.log('params: ', params);
    if (this.store.confirmMarkReservationAsRequestCancel()) {
      return this.translocoService.translate('USER_MODALS.CONFIRM_REQUEST_CANCEL_BODY', params);
    }

    return '';
  }

  ngOnInit() {
    if (this.auth.currentUser()) {
      this.facade.getOrganizationsOfUser(true, this.auth.currentUser()?.id ?? 0);
    }
    this.facade.getRooms();

    this.facade.getAllReservationsForUserAndTheirOrganization();
    this.facade.connectToReservationStream();
  }

  handleClickCreateTeam() {
    this.store.isAddOrganizationModalActive.set(true);
  }

  ngOnDestroy() {
    if (this.sseController) {
      this.sseController.abort();
    }
  }

  openRequestCancellation(res: ReservationDto) {
    this.facade.openConfirmationUpdateReservationsStatus(
      [res],
      ReservationStatus.REQUESTED_CANCELLATION,
    );
  }
}
