import { inject, Injectable } from '@angular/core';
import { ReservationApi } from './reservation.api';
import { ReservationStore } from './reservation.store';
import { CalendarHelper } from '../calendar/calendar.helper';
import { AuthService } from '../../auth/authService';
import { ActivatedRoute, Router } from '@angular/router';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ReservationType } from '../../model/reservationType';
import { CreateReservationRequest } from '../../model/CreateReservationRequest';
import { ReservationStatus } from '../../model/reservationStatus';
import { ReservationDto } from '../../model/reservationDto';
import { COMPOSITION_BUFFER_MODE } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class ReservationFacade {
  private api = inject(ReservationApi);
  private store = inject(ReservationStore);
  private helper = inject(CalendarHelper);
  private authService = inject(AuthService);
  private router = inject(Router);
  private sseController: AbortController | null = null;
  private readonly route = inject(ActivatedRoute);

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

  getRooms() {
    this.api.getRooms().subscribe({
      next: (rooms) => {
        this.store.rooms.set(rooms);
        console.log('Get rooms data:');
        console.table(rooms);
      },
      error: (e) => console.log('Error fetching rooms: ', e),
    });
  }

  getRoomsAndReservations() {
    this.api.getRooms().subscribe({
      next: (rooms) => {
        this.store.rooms.set(rooms);
        console.log('Get rooms data:');
        console.table(rooms);
      },
      error: (e) => console.log('Error fetching rooms: ', e),
    });

    // get reservations for a week, 12*3*7=252
    this.api.getReservations(this.store.paginationPage(), 252).subscribe({
      next: (pageData) => {
        this.store.reservations.set(pageData.content);
        console.log('Get reservations data:');
        console.table(pageData.content);
      },
      error: (e) => console.log('Error fetching res: ', e),
    });
  }

  getAllReservationsForUserAndTheirOrganization() {
    const userId = (this.authService.userId() || '').toString().replace(/['"]/g, '');
    const userIdNumber = parseInt(userId, 10);

    this.api
      .getAllReservationsForUserAndTheirOrganization(
        userIdNumber,
        this.store.paginationPage(),
        this.store.paginationSize(),
      )
      .subscribe({
        next: (pageData) => {
          this.store.reservations.set([]);

          console.log(
            'getAllReservationsForUserAndTheirOrganization: Fetched reservations for user and their organization:',
          );
          console.table(pageData.content);

          this.store.reservations.set(pageData.content);
        },

        error: (e) => console.log('Error: ', e),
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

  openBookingModal(hour: number, roomId: number) {
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
      reservationType: ReservationType.REHERSEAL,
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

  changeUsersPage(direction: 'next' | 'prev') {
    const currentPage = this.store.orgsPage();
    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    this.store.orgsPage.set(newPage);
    this.getAllUsers();
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

  markOrganizationsAsTrusted(): void {
    this.api.markOrganizationsAsTrusted(this.store.toolbarSelectedIds()).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => console.error(`Failed to markOrganizationsAsTrusted`, e),
    });
  }

  markOrganizationsAsUntrusted(): void {
    this.api.markOrganizationsAsUntrusted(this.store.toolbarSelectedIds()).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => console.error(`Failed to markOrganizationsAsUnTrusted`, e),
    });
  }

  getAllUsers() {
    const page = this.store.userPage();
    let size = this.store.userSize();
    if (size === 0) size = 20;
    return this.api.getAllUsers(page, size).subscribe({
      next: (users) => {
        this.store.allUsers.set(users);
        this.refreshOrganizations();
      },
      error: (e) => console.error('Error fetching all users: ', e),
    });
  }
  getReservationsByStatus(status: ReservationStatus): void {
    const sortBy = this.store.currentSortBy();
    const sortDir = this.store.currentSortDir();
    const page = this.store.paginationPage();
    const size = this.store.paginationSize();

    const sortParam = `${sortBy},${sortDir}`;

    this.api.getReservationsByStatus(page, size, status, sortParam).subscribe({
      next: (pageData) => {
        this.store.reservationsByStatus.set(pageData.content);
        this.store.paginationTotalNumber.set(pageData.totalElements);
        this.store.paginationTotalPages.set(pageData.totalPages - 1);
        this.store.paginationIsFirst.set(pageData.first);
        this.store.paginationIsLast.set(pageData.last);
      },
      error: (e) => console.error('Error fetching reservations by status: ', e),
    });
  }

  changeReservationsByStatusSize(newSize: number) {
    this.store.paginationSize.set(newSize);

    const currentStatus = this.store.statusForAdminPage();
    if (currentStatus) {
      this.getReservationsByStatus(currentStatus);
    }
  }

  updateReservationsStatus(targetStatus: ReservationStatus): void {
    const ids = this.store.toolbarSelectedIds();

    if (!ids || ids.size === 0) {
      console.error('No reservation IDs selected for status update');
      return;
    }

    this.api.updateReservationsStatus(ids, targetStatus).subscribe({
      next: () => {
        const currentStatus = this.store.statusForAdminPage() ?? ReservationStatus.CREATED;
        this.getReservationsByStatus(currentStatus);
        this.store.clearSelection();
      },
      error: (err: unknown) => {
        console.error('Error updating reservation status:', err);
        this.store.globalErrorKey.set('ERROR.STATUS_UPDATE_FAILED');
      },
    });
  }
  // pagination

  changeReservationsByStatusPage(direction: 'next' | 'prev'): void {
    const currentPage = this.store.paginationPage();
    const totalPages = this.store.paginationTotalPages(); // Zakładając, że masz to w store

    let newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    newPage = Math.max(0, Math.min(newPage, totalPages));

    if (newPage === currentPage) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: newPage },
      queryParamsHandling: 'merge',
    });
  }

  // modals

  closeModals(): void {
    this.store.isAdminAddOrganizationModalActive.set(false);
    this.store.isAdminAddOrganizationSuccessPopupActive.set(false);
    this.store.confirmMarkReservationAsCanceled.set(false);
    this.store.isModalDeleteOwnerActive.set(false);
    this.store.isModalDeleteMemberActive.set(false);
    this.store.isModalDeleteOrganizationActive.set(false);

    this.store.isModalDeleteOrganizationSuccessActive.set(false);
    this.store.isModalDeleteMemberSuccessActive.set(false);
    this.store.isModalDeleteOwnerSuccessActive.set(false);

    this.store.globalErrorKey.set(null);
    this.store.isAddOrganizationModalActive.set(false);
    this.store.popupConfirmationActive.set(false);

    this.store.confirmMarkReservationAsRequestCancel.set(false);
    this.store.globalErrorKey.set(null);
    this.store.isBanUsersModalActive.set(false);
    this.store.isBanUsersSuccessActive.set(false);

    this.store.displayBookingSuccesfulPopup.set(false);
  }

  handleClickBanUsers() {
    this.store.isBanUsersModalActive.set(true);
  }

  handleAddOrganization() {
    this.store.isAdminAddOrganizationModalActive.set(true);
    this.router.navigate(['/admin/organizations']);
  }

  handleAcceptReservations(resIds: Set<number>) {
    this.store.toolbarSelectedIds.set(resIds);
    this.updateReservationsStatus(ReservationStatus.CONFIRMED);
    this.store.confirmMarkReservationAsAccepted.set(false);
    this.store.popupMarkedReservationAsAccepted.set(true);
  }
  handleCancelReservation(resIds: Set<number>) {
    this.store.toolbarSelectedIds.set(resIds);

    this.updateReservationsStatus(ReservationStatus.CANCELLED);
    this.store.confirmMarkReservationAsCanceled.set(false);
    this.store.popupMarkedReservationAsCanceled.set(true);
  }

  // ==================================

  handleCancelReservations() {
    const res = new Set<number>(this.store.selectedReservations()?.map((r) => r.id));
    console.log('handleCancelReservations: ');
    console.table(res);

    if (!res) {
      return;
    }
    this.updateReservationsStatus(ReservationStatus.CANCELLED);
    this.store.confirmMarkReservationAsCanceled.set(false);
    this.store.popupMarkedReservationAsCanceled.set(true);
  }

  openConfirmationUpdateReservationsStatus(
    reservations: ReservationDto[],
    status: ReservationStatus,
  ) {
    const res = new Set<number>(this.store.selectedReservations()?.map((r) => r.id));
    this.store.selectedReservations.set(reservations);

    switch (status) {
      case ReservationStatus.CONFIRMED: {
        this.store.confirmMarkReservationAsAccepted.set(true);
        break;
      }
      case ReservationStatus.CANCELLED: {
        this.store.confirmMarkReservationAsCanceled.set(true);
        const reservs = this.store
          .reservationsByStatus()
          .filter((r) => this.store.toolbarSelectedIds().has(r.id));
        console.log('handleClickCancelReservations: ');
        console.table(reservs);
        this.store.selectedReservations.set(reservs);

        break;
      }
      case ReservationStatus.REJECTED: {
        this.store.confirmMarkReservationAsRejected.set(true);
        break;
      }
      case ReservationStatus.REJECTED_CANCELLATION: {
        this.store.confirmMarkReservationAsRequestCancel.set(true);

        break;
      }
      default: {
        console.error('Error updating res status');
      }
    }
  }

  // ==================================

  banUsers() {
    const userIds = this.store.toolbarSelectedIds();
    const reason = this.store.banReason();
    const duration = this.store.banDuration();

    this.api.banUsers(userIds, reason, duration).subscribe({
      next: () => {
        console.log('Banned userId ', userIds);
        this.getAllUsers();
        this.store.isBanUsersModalActive.set(false);
        this.store.isBanUsersSuccessActive.set(true);
      },
      error: (e) => {
        console.error('Error banning userId ', userIds, ': ', e);
        this.store.globalErrorKey.set(e);
      },
    });
  }

  unbanUsers() {
    const userIds = this.store.toolbarSelectedIds();

    this.api.unbanUsers(userIds).subscribe({
      next: () => {
        console.log('Banned userId ', userIds);
        this.getAllUsers();
      },
      error: (e) => {
        console.error('Error banning userId ', userIds, ': ', e);
        this.store.globalErrorKey.set(e);
      },
    });
  }

  // ==================================

  markUsersTrusted() {
    console.log('markUsersTrusted facade: ', this.store.toolbarSelectedIds());
    this.api.markUsersTrusted(this.store.toolbarSelectedIds()).subscribe({
      next: () => {
        this.getAllUsers();
      },
      error: (e) => {
        console.error('Error marking user as trusted: ', e);
        this.store.globalErrorKey.set('Error marking user as trusted');
      },
    });
  }

  markUsersUntrusted() {
    const userIds = this.store.toolbarSelectedIds();
    const trusted = false;
    this.api.markUsersUntrusted(this.store.toolbarSelectedIds()).subscribe({
      next: () => {
        this.getAllUsers();
      },
      error: (e) => {
        console.error('Error marking user as trusted: ', e);
        this.store.globalErrorKey.set('Error marking user as trusted');
      },
    });
  }

  // ==================================

  searchReservations(): ReservationDto[] {
    const query = (this.store.searchBarQuery() ?? '').trim().toLowerCase();
    const reservations = this.store.reservations();

    if (!query) return reservations;

    const matchingUserIds = new Set(
      this.store
        .allUsers()
        .filter(
          (u) => u.nick?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query),
        )
        .map((u) => u.id),
    );

    const matchingRoomIds = new Set(
      this.store
        .rooms()
        .filter((r) => r.name?.toLowerCase().includes(query))
        .map((r) => r.id),
    );

    const matchingOrgIds = new Set(
      this.store
        .allOrganizations()
        .filter((o) => o.name?.toLowerCase().includes(query))
        .map((o) => o.id),
    );

    return reservations.filter((reservation: ReservationDto) => {
      const matchesRoom = matchingRoomIds.has(reservation.room);

      const isOrgReservation =
        reservation.organization !== null && reservation.organization !== undefined;

      const matchesReservedBy = isOrgReservation
        ? matchingOrgIds.has(reservation.organization)
        : matchingUserIds.has(reservation.reservedBy);

      return matchesRoom || matchesReservedBy;
    });
  }
}
