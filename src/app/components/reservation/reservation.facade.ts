import { inject, Injectable } from '@angular/core';
import { ReservationApi } from './reservation.api';
import { ReservationStore } from './reservation.store';
import { CalendarHelper } from '../calendar/calendar.helper';
import { AuthService } from '../../auth/authService';
import { Router } from '@angular/router';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ReservationType } from '../../model/reservationType';
import { CreateReservationRequest } from '../../model/CreateReservationRequest';
import { ReservationStatus } from '../../model/reservationStatus';
import { ReservationDto } from '../../model/reservationDto';

@Injectable({ providedIn: 'root' })
export class ReservationFacade {
  private api = inject(ReservationApi);
  private store = inject(ReservationStore);
  private helper = inject(CalendarHelper);
  private authService = inject(AuthService);
  private router = inject(Router);
  private sseController: AbortController | null = null;

  initializeCalendar(isAdmin: boolean) {
    this.getRoomsAndReservations();

    const userId = this.authService.userId();
    if (!userId) {
      console.error('User id not loaded yet');
      return;
    }

    console.log('Initializing calendar...');
    this.refreshOrganizations();
    this.connectToReservationStream();
  }

  refreshOrganizations() {
    if (this.authService.isAdmin()) {
      this.getAllMembersAllOrganizations(0);
      console.log('refreshed admin organizations:');
    } else {
      this.getOrganizationsOfUserWithMembers(0);
      console.log(
        "refreshed user's organizations (count): ",
        this.store.userOrganizations().length,
      );
      console.table(this.store.userOrganizations());
    }
  }

  getRoomsAndReservations() {
    this.api.getRooms().subscribe({
      next: (rooms) => this.store.rooms.set(rooms),
      error: (e) => console.log('Error fetching rooms: ', e),
    });

    this.api
      .getReservations(this.store.reservationsPage(), this.store.reservationsSize())
      .subscribe({
        next: (pageData) => {
          this.store.reservations.set(pageData.content);
          console.log('Get reservations data:');
          console.table(pageData.content);
        },
        error: (e) => console.log('Error fetching res: ', e),
      });
  }

  confirmBooking() {
    const booking = this.store.selectedBooking();
    console.log('confirmBooking()...');
    if (!booking) return;

    const [year, month, day] = booking.date.split('-').map(Number);

    const utcTimestamp = Date.UTC(year, month - 1, day, booking.hour, 0, 0, 0);
    const startAtDate = new Date(utcTimestamp);
    const isPrivate = this.store.isPrivateReservationCheckboxActivated();

    let req: CreateReservationRequest = {
      roomId: booking.roomId,
      startAt: startAtDate.toISOString(),
      duration: `PT${booking.duration}H`,
      type: ReservationType.REHERSEAL,
      organizationId: isPrivate ? null : booking.organizationId,
    };

    console.log('req sent to backend (Standard UTC): ');
    console.table(req);

    this.api.postReservation(req).subscribe({
      next: () => {
        this.store.selectedBooking.set(null);
        this.store.displayBookingSuccesfulPopup.set(true);
        this.getRoomsAndReservations();
        console.log('success from this.api.postReservation!');
      },
      error: (err) => {
        console.error('Booking error response:', err);
        this.store.selectedBooking.set(null);
        this.store.displayBookingErrorPopup.set(true);
      },
    });
  }

  selectDay(day: Date) {
    this.store.daySelectedByUser.set(day);
    this.store.currentWeekStart.set(this.helper.getStartOfWeek(day));
    this.store.currentMonthDate.set(new Date(day.getFullYear(), day.getMonth(), 1));
  }

  navigateWeek(direction: 'prev' | 'next') {
    const current = new Date(this.store.daySelectedByUser());
    current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    this.selectDay(current);
  }

  navigateMonth(direction: 'prev' | 'next') {
    const d = new Date(this.store.currentMonthDate());
    d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
    this.store.currentMonthDate.set(d);
    this.selectDay(d);
  }

  handleBookingClick(hour: number, roomId: number) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    const day = this.store.daySelectedByUser();
    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

    const userOrgs = this.store.userOrganizations();
    const allOrgs = this.store.allOrganizations();
    let defaultOrg = userOrgs[0]?.id;

    if (!defaultOrg && this.authService.isAdmin()) {
      defaultOrg = allOrgs[0]?.id;
    }

    const rawUserId = (this.authService.userId() || '0').toString().replace(/['"]/g, '');

    this.store.selectedBooking.set({
      date: dateStr,
      hour,
      roomId,
      duration: 1,
      roomName: this.store.rooms().find((r) => r.id === roomId)?.name,
      organizationId: defaultOrg || 0,
      reservedByUserId: parseInt(rawUserId, 10),
    });
  }

  connectToReservationStream() {
    this.disconnectStream();
    this.sseController = new AbortController();
    const url = `${process.env['VSF_API_URL'] || ''}/sse`;
    fetchEventSource(url, {
      method: 'GET',
      signal: this.sseController.signal,
      onmessage: (msg) => {
        const msgData = JSON.parse(msg.data);
        const reservedBy: ReservationDto = JSON.parse(msg.data);
        const reservedById = reservedBy.reservedBy;

        if (msg.event === 'RESERVATION_CREATED' || msg.event === 'RESERVATION_REMOVED') {
          this.getRoomsAndReservations();
        }

        const safeUserId = parseInt(
          (this.authService.userId() || '').toString().replace(/['"]/g, ''),
        );
        if (msg.event === 'RESERVATION_CREATED' && reservedById !== safeUserId) {
          this.store.displayBookingErrorPopup.set(true);
        }
      },
    });
  }

  getAllReservationsForUserAndTheirOrganization(userId: number) {
    this.api
      .getAllReservationsForUserAndTheirOrganization(
        userId,
        this.store.reservationsPage(),
        this.store.reservationsSize(),
      )
      .subscribe({
        next: (pageData) => this.store.reservations.set(pageData.content),
        error: (e) => console.log('Error: ', e),
      });
  }

  deleteReservation(id: number) {
    this.api.deleteReservation(id).subscribe({
      next: () => console.log(`Successfully deleted reservation with id ${id}`),
      error: (e) => console.error(`Failed to delete reservation with id ${id}`, e),
    });
  }

  getTestText() {
    this.api.getTestText().subscribe({
      next: (data) => this.store.testText.set(data),
      error: (e) => console.error('Failed to fetch test text: ', e),
    });
  }

  getAllRooms() {
    this.api.getRooms().subscribe({
      next: (rooms) => this.store.rooms.set(rooms),
      error: (e) => console.error('Error fetching rooms: ', e),
    });
  }

  disconnectStream() {
    if (this.sseController) {
      this.sseController.abort();
      this.sseController = null;
    }
  }

  getUserByEmail(email: string) {
    this.api.getUserByEmail(email).subscribe({
      next: (u) => console.log('fetched user by email: ', u),
      error: (e) => console.log('error fetching user by email: ', e),
    });
  }

  // ======================= ORGS ========================

  getAllMembersAllOrganizations(page: number = 0) {
    this.api.getAllMembersAllOrganizations(page, this.store.orgsSize()).subscribe({
      next: (pageData) => {
        this.store.allOrganizations.set(pageData.content);

        if (this.authService.isAdmin()) {
          this.store.userOrganizations.set(pageData.content);
        }

        this.store.orgsPage.set(pageData.number);
        this.store.orgsTotalPages.set(pageData.totalPages);
        this.store.orgsTotalElements.set(pageData.totalElements);
        this.store.orgsIsFirst.set(pageData.first);
        this.store.orgsIsLast.set(pageData.last);
      },
      error: () => console.error('Error in getAllMembersAllOrganizations'),
    });
  }

  changeOrganizationsPage(direction: 'next' | 'prev') {
    const currentPage = this.store.orgsPage();
    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    if (this.authService.isAdmin()) {
      this.getAllMembersAllOrganizations(newPage);
    } else {
      this.getOrganizationsOfUserWithMembers(newPage);
    }
  }

  createOrganization(name: string) {
    this.api.createOrganization(name).subscribe({
      next: () => {
        console.log(`Created organization ${name}`);
        this.refreshOrganizations();
      },
      error: (e) => console.error(`Failed to create organization ${name}`, e),
    });
  }

  getOrganizationsOfUserWithMembers(page: number = 0) {
    this.api.getOrganizationsOfUserWithMembers(page, this.store.orgsSize()).subscribe({
      next: (pageData) => {
        this.store.userOrganizations.set(pageData.content);
        this.store.orgsPage.set(pageData.number);
        this.store.orgsTotalPages.set(pageData.totalPages);
        this.store.orgsTotalElements.set(pageData.totalElements);
        this.store.orgsIsFirst.set(pageData.first);
        this.store.orgsIsLast.set(pageData.last);
        console.log('fetched getOrganizationsOfUserWithMembers(): ');
        console.table(pageData.content);
      },
      error: (e) => console.error('Error in getOrganizationsOfUserWithMembers: ', e),
    });
  }

  removeOwnerFromOrganization(ownerId: number, organizationId: number): void {
    this.api.removeUserFromOrganization(ownerId, organizationId).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => {
        this.store.globalErrorKey.set('ORGANIZATION_LIST.ERRORS.REMOVE_OWNER_FAILED');
        console.error(e);
      },
    });
  }

  removeUserFromOrganization(userId: number, organizationId: number): void {
    this.api.removeUserFromOrganization(userId, organizationId).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => {
        this.store.globalErrorKey.set('ORGANIZATION_LIST.ERRORS.REMOVE_USER_FAILED');
        console.error(e);
      },
    });
  }

  removeOrg(organizationId: number): void {
    this.api.removeOrg(organizationId).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => {
        console.error(`Failed to delete organization`, e);
        this.store.globalErrorKey.set('ORGANIZATION_LIST.ERRORS.DELETE_ORG_FAILED');
      },
    });
  }

  addOwnerIntoOrganization(ownerId: number, organizationId: number): void {
    this.api.addOwnerIntoOrganization(ownerId, organizationId).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => console.error(`Failed to add owner`, e),
    });
  }

  addUserIntoOrganization(userId: number, organizationId: number): void {
    this.api.addUserIntoOrganization(userId, organizationId).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => console.error(`Failed to add user`, e),
    });
  }

  markOrganizationAsTrusted(organizationId: number): void {
    const trusted = !this.store.allOrganizations().find((org) => org.id === organizationId)
      ?.trusted;
    this.api.markOrganizationAsTrusted(organizationId, trusted).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => console.error(`Failed to mark organization`, e),
    });
  }

  getAllUsers() {
    return this.api.getAllUsers().subscribe({
      next: (users) => {
        this.store.allUsers.set(users);
        this.refreshOrganizations();
      },
      error: (e) => console.error('Error fetching all users: ', e),
    });
  }

  markUserTrusted(isTrusted: boolean, userId: number) {
    this.api.markUserTrusted(!isTrusted, userId).subscribe({
      next: () => {
        this.getAllUsers();
      },
      error: (e) => {
        console.error('Error marking user as trusted: ', e);
        this.store.globalErrorKey.set('Error marking user as trusted');
      },
    });
  }

  getReservationsByStatus(status: ReservationStatus) {
    this.api
      .getReservationsByStatus(this.store.reservationsPage(), this.store.reservationsSize(), status)
      .subscribe({
        next: (pageData) => {
          this.store.reservationsByStatus.set(pageData.content);
          this.store.totalNumberOfCreatedReservations.set(pageData.totalElements);
          console.log('getReservationsByStatus data:');
          console.table(pageData.content);
        },
        error: (e) => console.log('Error fetching res: ', e),
      });
  }

  changeReservationsByStatusPage(direction: 'next' | 'prev') {
    const currentPage = this.store.pageOfCreatedReservations();
    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    if (this.authService.isAdmin()) {
      this.getAllMembersAllOrganizations(newPage);
    } else {
      this.getOrganizationsOfUserWithMembers(newPage);
    }
  }

  markReservationAsAccepted(reservationId: number) {
    this.api.markReservationAsAccepted(reservationId).subscribe({
      next: () => {
        if (this.authService.isAdmin()) {
          this.getRoomsAndReservations();
        } else if (this.authService.currentUser()?.id != 0) {
          this.getAllReservationsForUserAndTheirOrganization(
            this.authService.currentUser()?.id ?? 0,
          );
        }
        this.store.popupMarkedReservationAsAccepted.set(true);
        this.getReservationsByStatus(ReservationStatus.CREATED);
      },
      error: (e) => {
        console.error('Error markReservationAsAccepted: ', e);
        this.store.globalErrorKey.set('Error markReservationAsAccepted');
      },
    });
  }

  markReservationAsRequestCancel(reservationId: number) {
    this.api.markReservationAsRequestCancel(reservationId).subscribe({
      next: () => {
        if (this.authService.isAdmin()) {
          this.getRoomsAndReservations();
        } else if (this.authService.currentUser()?.id != 0) {
          this.getAllReservationsForUserAndTheirOrganization(
            this.authService.currentUser()?.id ?? 0,
          );
        }
        this.store.popupMarkedReservationAsRequestCancel.set(true);
        this.getReservationsByStatus(ReservationStatus.CREATED);
      },
      error: (e) => {
        console.error('Error markReservationAsAccepted: ', e);
        this.store.globalErrorKey.set('Error markReservationAsAccepted');
      },
    });
  }

  markReservationAsCanceled(reservationId: number) {
    this.api.markReservationAsCanceled(reservationId).subscribe({
      next: () => {
        if (this.authService.isAdmin()) {
          this.getRoomsAndReservations();
        } else if (this.authService.currentUser()?.id != 0) {
          this.getAllReservationsForUserAndTheirOrganization(
            this.authService.currentUser()?.id ?? 0,
          );
        }
        this.store.popupMarkedReservationAsCanceled.set(true);
        this.getReservationsByStatus(ReservationStatus.CREATED);
      },
      error: (e) => {
        console.error('Error markReservationAsAccepted: ', e);
        this.store.globalErrorKey.set('Error markReservationAsAccepted');
      },
    });
  }

  closeModals(): void {
    this.store.isAdminAddOrganizationActive.set(false);
    this.store.isAdminAddOrganizationSuccess.set(false);

    this.store.modalDeleteOwnerActive.set(false);
    this.store.modalDeleteMemberActive.set(false);
    this.store.modalDeleteOrganizationActive.set(false);

    this.store.modalDeleteOrganizationSuccess.set(false);
    this.store.modalDeleteMemberSuccess.set(false);
    this.store.modalDeleteOwnerSuccess.set(false);

    this.store.globalErrorKey.set(null);
    this.store.modalAddOrganizationActive.set(false);
    this.store.popupConfirmationActive.set(false);
  }

  handleAddOrganization() {
    this.store.isAdminAddOrganizationActive.set(true);
    this.router.navigate(['/admin/organizations']);
  }

  handleConfirmAcceptReservation(res: ReservationDto) {
    this.store.confirmMarkReservationAsAccepted.set(true);
    this.store.selectedReservation.set(res);
  }

  handleAcceptReservation(res: ReservationDto) {
    this.markReservationAsAccepted(res.id);
    this.store.confirmMarkReservationAsAccepted.set(false);
    this.store.popupMarkedReservationAsAccepted.set(true);
  }

  handleClickCancelReservation(res: ReservationDto) {
    this.store.confirmMarkReservationAsCanceled.set(true);
    this.store.selectedReservation.set(res);
  }

  handleCancelReservation(res: ReservationDto) {
    this.markReservationAsCanceled(res.id);
    this.store.confirmMarkReservationAsCanceled.set(false);
    this.store.popupMarkedReservationAsCanceled.set(true);
  }

  handleConfirmRequestCancelReservation(res: ReservationDto) {
    this.markReservationAsCanceled(res.id);
    this.store.confirmMarkReservationAsCanceled.set(false);
    this.store.popupMarkedReservationAsCanceled.set(true);
  }
}
