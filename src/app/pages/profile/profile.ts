import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth/authService';
import { User } from '../../model/user';
import { Organization } from '../../model/organization';
import { ReservationDto } from '../../model/reservationDto';
import { Room } from '../../model/room';
import { Tab } from '../../model/tab';
import { OrganizationFront } from '../../model/organizationFront';
import { forkJoin, map } from 'rxjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ReservationWrapper } from '../../model/reservationWrapper';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { CalendarHelper } from '../../components/calendar/calendar.helper';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextFormatingTool } from '../../tools/textFormatingTool';
import { ConfirmationPopup } from '../../modals/confirmation-popup/confirmation-popup';
import { AddOrganizationModal } from '../../components/modals/add-organization-modal/add-organization-modal';
import { ReservationStatus } from '../../model/reservationStatus';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, ConfirmationPopup, AddOrganizationModal],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);
  readonly translocoService = inject(TranslocoService);
  readonly helper = inject(CalendarHelper);
  readonly email = this.authService.email();
  readonly reservationToDelete = signal<ReservationDto | null>(null);
  readonly textFormatingTool = inject(TextFormatingTool);
  readonly calendarHelper = inject(CalendarHelper);

  private sseController: AbortController | null = null;

  readonly userId = parseInt(this.authService.userId() || '-1');

  constructor() {
    this.authService.checkCurrentSession().subscribe();
  }

  reservedByLabel(reservation: ReservationDto): string {
    const org = this.store.userOrganizations().find((o) => o.id === reservation.organization);

    return org ? `${org.name}` : this.translocoService.translate('USER_MODALS.PRIVATE');
  }

  activeTab = signal<Tab>(new Tab(0, 'Moje rezerwacje', 'reservations', undefined));
  allTabs = computed(() => {
    let id = 0;
    const newTabs: Tab[] = [];

    newTabs.push(new Tab(id++, 'Moje rezerwacje', 'reservations', undefined));

    for (const org of this.store.userOrganizations()) {
      newTabs.push(new Tab(id++, org.name, 'organization', org));
    }
    newTabs.push(new Tab(id++, 'Utwórz zespół', 'createorganization', undefined));

    return newTabs;
  });

  activeOrgsUsers = computed(() => {
    const activeTab = this.activeTab();
    if (activeTab.type === 'organization' && activeTab.org) {
      return activeTab.org.members;
    }
    return [];
  });

  readonly organizations = signal<Organization[]>([]);
  readonly reservations = signal<ReservationDto[]>([]);
  readonly areYouSure = signal<boolean>(false);

  ngOnInit() {
    this.facade.getRooms();
    this.facade.getOrganizationsOfUserWithMembers();
    this.facade.getAllReservationsForUserAndTheirOrganization();
    this.facade.connectToReservationStream();
  }

  formatDuration(res: ReservationDto): string {
    return this.calendarHelper.generateDurationLabel(res.startAt, res.duration);
  }

  deleteReservation(reservationId: number) {
    console.log(`Trying to delete reservation with id ${reservationId}`);
    this.facade.deleteReservation(reservationId);
    this.facade.getAllReservationsForUserAndTheirOrganization();
    this.areYouSure.set(false);
  }

  deleteTeamMember(userId: number) {
    console.log(`Trying to delete team member with id ${userId}`);
    this.facade.removeUserFromOrganization(userId, this.activeTab().org!.id);
  }

  handleClickCreateTeam() {
    this.store.isAddOrganizationModalActive.set(true);
  }

  ngOnDestroy() {
    if (this.sseController) {
      this.sseController.abort();
    }
  }

  getTitleText(): string {
    console.log('Confirming cancellation for reservation:', this.store.selectedReservation());
    if (this.store.confirmMarkReservationAsRequestCancel()) {
      return this.translocoService.translate('USER_MODALS.CONFIRM_REQUEST_CANCEL_TITLE');
    }
    return '';
  }

  getBodyText(): string {
    console.log('Confirming getBodyText for reservation:', this.store.selectedReservation());
    console.log(
      'this.store.confirmMarkReservationAsRequestCancel(): ',
      this.store.confirmMarkReservationAsRequestCancel(),
    );

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

  getRoomName(res: ReservationDto): string {
    const room = this.store.rooms().find((r) => r.id === res.room);
    return room ? room.name : '';
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
