import { inject, Injectable } from '@angular/core';
import { ReservationApi } from './reservation.api';
import { ReservationStore } from './reservation.store';
import { CalendarHelper } from '../calendar/calendar.helper';
import { AuthService } from '../../auth/authService';
import { Router } from '@angular/router';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ReservationType } from '../../model/reservationType';
import { CreateReservationRequest } from '../../model/CreateReservationRequest';

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

    console.log('initializing calendar...');
    if (isAdmin) {
      this.getAllMembersAllOrganizations();
    }
    this.api.getOrganizationsOfUserWithMembers(0, this.store.orgsSize()).subscribe((pageData) => {
      console.log('initializeCalendar getOrganizationsOfUserWithMembers: ' + pageData.content);
      this.store.userOrganizations.set(pageData.content);
      console.log('this.store.userOrganizations(): ');
      console.table(this.store.userOrganizations());
    });

    this.connectToReservationStream();
  }

  getRoomsAndReservations() {
    this.api.getRooms().subscribe({
      next: (rooms) => this.store.rooms.set(rooms),
      error: (e) => console.log('Error fetching rooms: ', e),
    });

    this.api
      .getReservations(this.store.reservationsPage(), this.store.reservationsSize())
      .subscribe({
        next: (pageData) => this.store.reservations.set(pageData.content),
        error: (e) => console.log('Error fetching res: ', e),
      });
  }

  confirmBooking() {
    const booking = this.store.selectedBooking();
    if (!booking) return;

    const startAtDate = new Date(booking.date);
    startAtDate.setHours(booking.hour, 0, 0, 0);

    console.log('Booking: ', booking);

    let req: CreateReservationRequest = {
      roomId: booking.roomId,
      startAt: startAtDate.toISOString(),
      duration: `PT${booking.duration}H`,
      type: ReservationType.REHERSEAL,
      organizationId: booking.organizationId,
    };
    console.log('req: ', req);

    this.api.postReservation(req).subscribe({
      next: () => {
        this.store.selectedBooking.set(null);
        this.store.displayBookingSuccesfulPopup.set(true);
        this.getRoomsAndReservations();
      },
      error: () => {
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

    const defaultOrg = this.store.userOrganizations()[0]?.id || 0;

    this.store.selectedBooking.set({
      date: dateStr,
      hour,
      roomId,
      duration: 1,
      roomName: this.store.rooms().find((r) => r.id === roomId)?.name,
      organizationId: defaultOrg,
      reservedByUserId: parseInt(this.authService.userId() || '0', 10),
    });
  }

  connectToReservationStream() {
    this.disconnectStream();
    this.sseController = new AbortController();
    const url = `${process.env['VSF_API_URL'] || ''}/reservation/sse`;
    console.log('Connected to reservation SSE: ', url);
    fetchEventSource(url, {
      method: 'GET',
      signal: this.sseController.signal,
      onmessage: (msg) => {
        const msgData = JSON.parse(msg.data);
        const reservedBy = msgData.reservationDto.reservedBy;
        console.log('msgData ', msgData);
        console.log('msg.event ', msg.event);
        console.log('reservedBy ', reservedBy);
        if (msg.event === 'RESERVATION_CREATED' || msg.event === 'RESERVATION_REMOVED') {
          this.getRoomsAndReservations();
        }
        if (msg.event === 'RESERVATION_CREATED' && reservedBy !== `${this.authService.userId}`) {
          this.store.displayBookingErrorPopup();
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
      next: () => {
        console.log(`Successfully deleted reservation with id ${id}`);
      },
      error: (e) => console.error(`Failed to delete reservation with id ${id}`, e),
    });
  }

  getTestText() {
    this.api.getTestText().subscribe({
      next: (data) => {
        console.log('getTestText: ', data);
        this.store.testText.set(data);
      },
      error: (e) => console.error('Failed to fetch test text: ', e),
    });
  }

  getAllRooms() {
    this.api.getRooms().subscribe({
      next: (rooms) => {
        this.store.rooms.set(rooms);
      },
      error: (e) => {
        console.error('Error fetching rooms: ', e);
      },
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
      next: (u) => {
        console.log('fetched user by email: ', u);
      },
      error: (e) => {
        console.log('error fetching user by email: ', e);
      },
    });
  }

  // ======================= ORGS ========================

  getAllMembersAllOrganizations(page: number = 0) {
    this.api.getAllMembersAllOrganizations(page, this.store.orgsSize()).subscribe({
      next: (pageData) => {
        this.store.allOrganizations.set(pageData.content);
        this.store.orgsPage.set(pageData.number);
        this.store.orgsTotalPages.set(pageData.totalPages);
        this.store.orgsTotalElements.set(pageData.totalElements);
        this.store.orgsIsFirst.set(pageData.first);
        this.store.orgsIsLast.set(pageData.last);
        console.log("user's orgs:");
        console.table(pageData.content);
      },
      error: () => console.error('Error in getAllMembersAllOrganizations'),
    });
  }

  changeOrganizationsPage(direction: 'next' | 'prev') {
    const currentPage = this.store.orgsPage();
    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    this.getAllMembersAllOrganizations(newPage);
  }

  createOrganization(name: string) {
    this.api.createOrganization(name).subscribe({
      next: () => {
        console.log(`Created organization ${name}`);
        this.getAllMembersAllOrganizations(0);
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

        console.log('getOrganizationsOfUserWithMembers: ', pageData.content);
        console.log('this.store.userOrganizations(): ', this.store.userOrganizations());
      },
      error: (e) => console.error('Error in getOrganizationsOfUserWithMembers: ', e),
    });
  }

  removeOwnerFromOrganization(ownerId: number, organizationId: number): void {
    this.api.removeUserFromOrganization(ownerId, organizationId).subscribe({
      next: () => {
        console.log(
          `Successfully deleted user from organization with userId ${ownerId} and organizationId ${organizationId}`,
        );
      },
      error: (e) => {
        this.store.globalErrorKey.set('ORGANIZATION_LIST.ERRORS.REMOVE_OWNER_FAILED');
        console.error(
          `Failed to remove owner from organization with userId ${ownerId} and organizationId ${organizationId}`,
          e,
        );
      },
    });
  }
  removeUserFromOrganization(userId: number, organizationId: number): void {
    this.api.removeUserFromOrganization(userId, organizationId).subscribe({
      next: () => {
        console.log(
          `Successfully deleted user from organization with userId ${userId} and organizationId ${organizationId}`,
        );
      },
      error: (e) => {
        this.store.globalErrorKey.set('ORGANIZATION_LIST.ERRORS.REMOVE_USER_FAILED');
        console.error(
          `Failed to remove user from organization with userId ${userId} and organizationId ${organizationId}`,
          e,
        );
      },
    });
  }
  removeOrg(organizationId: number): void {
    this.api.removeOrg(organizationId).subscribe({
      next: () => {
        console.log(`Successfully deleted organization with id ${organizationId}`);
        this.getAllMembersAllOrganizations(0);
      },
      error: (e) => {
        console.error(`Failed to delete organization with id ${organizationId}`, e);
        this.store.globalErrorKey.set('ORGANIZATION_LIST.ERRORS.DELETE_ORG_FAILED');
        console.log('Current state of store:', {
          organizationListSelectedUserId: this.store.organizationListSelectedUser(),
          organizationListSelectedOrganizationId: this.store.organizationListSelectedOrganization(),
        });
      },
    });
  }

  addOwnerIntoOrganization(ownerId: number, organizationId: number): void {
    this.api.addOwnerIntoOrganization(ownerId, organizationId).subscribe({
      next: () => {
        console.log(
          `Successfully added owner with id ${ownerId} into organization with id ${organizationId}`,
        );
        this.getAllMembersAllOrganizations(0);
      },
      error: (e) =>
        console.error(
          `Failed to add owner with id ${ownerId} into organization with id ${organizationId}`,
          e,
        ),
    });
  }
  addUserIntoOrganization(userId: number, organizationId: number): void {
    this.api.addUserIntoOrganization(userId, organizationId).subscribe({
      next: () => {
        console.log(
          `Successfully added user with id ${userId} into organization with id ${organizationId}`,
        );
        this.getAllMembersAllOrganizations(0);
      },
      error: (e) =>
        console.error(
          `Failed to add user with id ${userId} into organization with id ${organizationId}`,
          e,
        ),
    });
  }
  markOrganizationAsTrusted(organizationId: number): void {
    const trusted = !this.store.allOrganizations().find((org) => org.id === organizationId)
      ?.trusted;

    this.api.markOrganizationAsTrusted(organizationId, trusted).subscribe({
      next: () => {
        console.log(
          `Successfully marked organization with id ${organizationId} as ${trusted ? 'trusted' : 'not trusted'}`,
        );
        this.getAllMembersAllOrganizations(0);
      },
      error: (e) =>
        console.error(
          `Failed to mark organization with id ${organizationId} as ${trusted ? 'trusted' : 'not trusted'}`,
          e,
        ),
    });
  }

  getAllUsers() {
    return this.api.getAllUsers().subscribe({
      next: (users) => {
        console.log('Fetched all users: ', users);
        this.store.allUsers.set(users);
      },
      error: (e) => {
        console.error('Error fetching all users: ', e);
      },
    });
  }
}
