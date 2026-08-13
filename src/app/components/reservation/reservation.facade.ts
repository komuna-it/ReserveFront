import { effect, inject, Injectable } from '@angular/core';
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
import { User } from '../../model/user';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrganizationMemberDto } from '../../model/organizationMemberDto';
import { Booking } from '../../model/booking';
import { finalize } from 'rxjs';

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
      this.getAllMembersAllOrganizations();
      console.log('refreshed admin organizations:');
    } else {
      if (this.authService.currentUser()) {
        this.getOrganizationsOfUser(true, this.authService.currentUser()?.id ?? 0);
      }
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

  postRoom(name: string) {
    return this.api.postRoom(name).subscribe({
      next: () => {
        console.log(`posted room ${name}`);
        this.getRooms();
      },
      error: (e) => {
        console.error(`error posting room ${name}`);
        this.store.globalErrorKey.set(e);
      },
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
    this.api.getReservations(this.store.currentReservationsPage(), 252).subscribe({
      next: (pageData) => {
        this.store.reservationsPage.set(pageData);
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
        this.store.currentReservationsPage(),
        this.store.currentReservationsSize(),
      )
      .subscribe({
        next: (pageData) => {
          console.log(
            'getAllReservationsForUserAndTheirOrganization: Fetched reservations for user and their organization:',
          );
          console.table(pageData.content);

          this.store.reservationsPage.set(pageData);
        },

        error: (e) => console.log('Error: ', e),
      });
  }

  getReservationsForOrganization() {
    const page = this.store.currentReservationsPage();
    const size = this.store.currentReservationsSize();
    const sortBy = this.store.currentSortBy();
    const sortDir = this.store.currentSortDir();
    const sortParam = `${sortBy},${sortDir}`;

    const orgId = this.store.selectedOrganization()?.id ?? 0;
    this.api.getReservationsForOrganization(page, size, sortParam, orgId).subscribe({
      next: (pageData) => {
        this.store.reservationsPage.set(pageData);
      },
      error: (e) => console.error('Error getReservationsForOrganization: ', e),
    });
  }

  getAllReservationsForUserAndTheirOrganizationsByUser(user: User) {
    const userIdNumber = user.id;

    this.api
      .getAllReservationsForUserAndTheirOrganization(
        userIdNumber,
        this.store.currentOrganizationsPage(),
        this.store.currentOrganizationsSize(),
      )
      .subscribe({
        next: (pageData) => {
          console.log(
            'getAllReservationsForUserAndTheirOrganization: Fetched reservations for user and their organization:',
          );
          console.table(pageData.content);

          this.store.reservationsPage.set(pageData);
        },

        error: (e) => console.log('Error: ', e),
      });
  }

  confirmBooking(): void {
    const booking = this.store.selectedBooking();
    if (!booking) return;

    const [year, month, day] = booking.date.split('-').map(Number);
    const startAt = new Date(Date.UTC(year, month - 1, day, booking.hour)).toISOString();

    const req: CreateReservationRequest = {
      roomId: booking.roomId,
      startAt,
      duration: `PT${booking.duration}H`,
      type: booking.reservationType,
      organizationId: this.store.isPrivateReservationCheckboxActivated()
        ? null
        : booking.organizationId,
      reservedByUserId: booking.reservedByUserId,
    };

    this.api.postReservation(req).subscribe({
      next: () => {
        this.store.selectedBooking.set(null);
        this.store.displayBookingSuccesfulPopup.set(true);
        this.getRoomsAndReservations();
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
    const price = this.store.price();
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
      price: price ?? 9999,
      duration: 1,
      roomName: this.store.rooms().find((r) => r.id === roomId)?.name,
      organizationId: defaultOrg || 0,
      reservedByUserId: parseInt(rawUserId, 10),
      reservationType: this.store.selectedReservationType() ?? ReservationType.REHEARSAL,
    });
    console.log('booking debugging:');
    console.table(this.store.selectedBooking());
  }

  connectToReservationStream() {
    console.log('Connecting to SSE');
    this.disconnectStream();
    this.sseController = new AbortController();

    const url = `${process.env['VSF_API_URL'] || ''}/sse`;

    fetchEventSource(url, {
      method: 'GET',
      signal: this.sseController.signal,
      headers: {
        Accept: 'text/event-stream',
      },
      onopen: async (response) => {
        if (response.ok) {
          console.log('SSE connection successfully opened!');
          return;
        }
        console.error('SSE connection failed with status:', response.status);
      },
      onmessage: (msg) => {
        console.log(`Fetched SSE! Event: ${msg.event}`, msg.data);

        if (!msg.data) return;

        try {
          const res: ReservationDto = JSON.parse(msg.data);

          if (msg.event === 'RESERVATION_CREATED' || msg.event === 'RESERVATION_REMOVED') {
            this.getRoomsAndReservations();
          }

          const safeUserId = parseInt(
            (this.authService.userId() || '').toString().replace(/['"]/g, ''),
            10,
          );
          const isAdminLogged = this.authService.isAdmin();
          const currentBooking = this.store.selectedBooking() ?? null;
          const isColizion = this.isSseReservationColiding(res, currentBooking);

          if (
            msg.event === 'RESERVATION_CREATED' &&
            isColizion &&
            res.reservedBy !== safeUserId &&
            !isAdminLogged
          ) {
            this.store.displayBookingErrorPopup.set(true);
          }
        } catch (err) {
          console.error('Error parsing SSE message data:', err, 'Data was:', msg.data);
        }
      },
      onerror: (err) => {
        console.error('SSE Stream Error:', err);
      },
    });
  }

  isSseReservationColiding(res: ReservationDto, b: Booking | null): boolean {
    if (!b) return false;

    if (Number(res.room) !== Number(b.roomId)) {
      return false;
    }

    const resStartDate = new Date(res.startAt);
    const resEndDate = new Date(res.endAt);

    const bookingStartDate = new Date(b.date);
    bookingStartDate.setUTCHours(b.hour, 0, 0, 0);

    const bookingEndDate = new Date(bookingStartDate);
    bookingEndDate.setUTCHours(b.hour + b.duration, 0, 0, 0);

    const isTimeOverlapping =
      resStartDate.getTime() < bookingEndDate.getTime() &&
      resEndDate.getTime() > bookingStartDate.getTime();

    return isTimeOverlapping;
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

  getReservationsByStatus(status: ReservationStatus): void {
    const sortBy = this.store.currentSortBy();
    const sortDir = this.store.currentSortDir();
    const page = this.store.currentReservationsPage();
    const size = this.store.currentReservationsSize();

    const sortParam = `${sortBy},${sortDir}`;

    this.api.getReservationsByStatus(page, size, status, sortParam).subscribe({
      next: (pageData) => {
        this.store.reservationsPage.set(pageData);
      },
      error: (e) => console.error('Error fetching reservations by status: ', e),
    });
  }

  changeReservationsByStatusSize() {
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

  changeReservationsPage(newPage: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [this.store.reservationsPageQueryParamName()]: newPage },
      queryParamsHandling: 'merge',
    });
  }

  changeReservationsSize(newSize: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [this.store.reservationsSizeQueryParamName()]: newSize,
        [this.store.reservationsPageQueryParamName()]: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  // ======================= ORGS ========================

  changeOrganizationsPage(newPage: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [this.store.organizationsPageQueryParamName()]: newPage },
      queryParamsHandling: 'merge',
    });
  }

  changeOrganizationsSize(newSize: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [this.store.organizationsSizeQueryParamName()]: newSize,
        [this.store.organizationsPageQueryParamName()]: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  getAllMembersAllOrganizations() {
    this.api
      .getAllMembersAllOrganizations(
        this.store.currentOrganizationsPage(),
        this.store.currentOrganizationsSize(),
      )
      .subscribe({
        next: (pageData) => {
          this.store.allOrganizations.set(pageData.content);

          if (this.authService.isAdmin()) {
            this.store.organizationsPage.set(pageData);
          }
        },
        error: () => console.error('Error in getAllMembersAllOrganizations'),
      });
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

  getOrganizationsOfUser(withMembers: boolean, userId: number) {
    this.api
      .getOrganizationsOfUser(
        this.store.currentOrganizationsPage(),
        this.store.currentOrganizationsSize(),
        withMembers,
        userId,
      )
      .subscribe({
        next: (pageData) => {
          this.store.organizationsPage.set(pageData);

          console.log('getOrganizationsOfUser(): ');
          console.table(pageData.content);
        },
        error: (e) => console.error('Error in getOrganizationsOfUser: ', e),
      });
  }

  removeOwnerFromOrganization(ownerId: number, organizationId: number): void {
    this.api.removeOwnerFromOrganization(ownerId, organizationId).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => {
        this.store.globalErrorKey.set('ORGANIZATION_LIST.ERRORS.REMOVE_OWNER_FAILED');
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

  addMemberToOrganization(userId: number, orgId: number): void {
    console.log(`[Facade] addMemberToOrganization -> userId: ${userId}, orgId: ${orgId}`);

    this.api.addMemberIntoOrganization(userId, orgId).subscribe({
      next: () => {
        console.log('[Facade] addMemberIntoOrganization -> sukces API');

        this.store.isModalAddMemberActive.set(false);
        this.store.organizationListSelectedUser.set(null);

        if (this.store.isModalAddMemberSuccessActive) {
          this.store.isModalAddMemberSuccessActive.set(true);
        }

        const addedUser = this.store.users().find((u) => u.id === userId);

        if (addedUser) {
          const newMember: OrganizationMemberDto = {
            id: 0,
            organizationId: orgId,
            userId: addedUser.id,
            role: 'MEMBER',
            email: addedUser.email,
            nick: addedUser.nick,
          };

          this.store.selectedOrganization.update((currentOrg) => {
            if (!currentOrg || currentOrg.id !== orgId) return currentOrg;
            return {
              ...currentOrg,
              members: [...(currentOrg.members || []), newMember],
            };
          });
        }

        this.refreshOrganizations();
      },
      error: (err) => {
        console.error('[Facade] Błąd podczas dodawania członka do organizacji:', err);
        this.store.globalErrorKey.set(err);
      },
    });
  }

  addOwnerToOrganization(userId: number, orgId: number): void {
    console.log(`[Facade] addOwnerToOrganization -> userId: ${userId}, orgId: ${orgId}`);

    this.api.addOwnerIntoOrganization(userId, orgId).subscribe({
      next: (res) => {
        console.log('[Facade] addOwnerIntoOrganization -> sukces API');

        this.store.isModalAddOwnerActive.set(false);
        this.store.organizationListSelectedUser.set(null);

        if (this.store.isModalAddOwnerSuccessActive) {
          this.store.isModalAddOwnerSuccessActive.set(true);
        }

        const addedUser = this.store.users().find((u) => u.id === userId);

        if (addedUser) {
          const newOwner: OrganizationMemberDto = {
            id: 0,
            organizationId: orgId,
            userId: addedUser.id,
            role: 'OWNER',
            email: addedUser.email,
            nick: addedUser.nick,
          };

          this.store.selectedOrganization.update((currentOrg) => {
            if (!currentOrg || currentOrg.id !== orgId) return currentOrg;
            return {
              ...currentOrg,
              owners: [...(currentOrg.owners || []), newOwner],
            };
          });

          console.log('[Facade] Dodano nowego właściciela do stanu lokalnego:', newOwner);
        }

        this.refreshOrganizations();
      },
      error: (err) => {
        console.error('[Facade] Błąd podczas dodawania właściciela do organizacji:', err);
        this.store.globalErrorKey.set(err);
      },
    });
  }

  markSingleOrganizationAsTrusted(organizationId: number): void {
    const ids = Array.of(organizationId);
    this.api.markOrganizationsAsTrusted(ids).subscribe({
      next: () => {
        const currentOrg = this.store.selectedOrganization();
        if (currentOrg && currentOrg.id === organizationId) {
          this.store.selectedOrganization.set({
            ...currentOrg,
            trusted: true,
          });
        }
        this.refreshOrganizations();
      },
      error: (e) => console.error(`Failed to markOrganizationsAsTrusted`, e),
    });
  }

  markSingleOrganizationAsUntrusted(organizationId: number): void {
    const ids = Array.of(organizationId);
    this.api.markOrganizationsAsUntrusted(ids).subscribe({
      next: () => {
        const currentOrg = this.store.selectedOrganization();
        if (currentOrg && currentOrg.id === organizationId) {
          this.store.selectedOrganization.set({
            ...currentOrg,
            trusted: false,
          });
        }
        this.refreshOrganizations();
      },
      error: (e) => console.error(`Failed to markOrganizationsAsUntrusted`, e),
    });
  }
  markOrganizationsAsTrusted(): void {
    const ids = Array.from(this.store.toolbarSelectedIds());
    this.api.markOrganizationsAsTrusted(ids).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => console.error(`Failed to markOrganizationsAsTrusted`, e),
    });
  }

  markOrganizationsAsUntrusted(): void {
    const ids = Array.from(this.store.toolbarSelectedIds());
    this.api.markOrganizationsAsUntrusted(ids).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => console.error(`Failed to markOrganizationsAsUnTrusted`, e),
    });
  }

  // ======== USERS

  preparePromoteMember(userId: number, orgId: number): void {
    console.log('preparePromoteMember userId ', userId, ' orgId ', orgId);
    this.api.promoteMemberToOwner(userId, orgId).subscribe({
      next: (updatedMember: OrganizationMemberDto) => {
        const org = this.store.selectedOrganization();
        if (!org || org.id !== orgId) return;

        const memberToPromote = org.members?.find((m) => m.userId === userId);

        const promotedUser: OrganizationMemberDto = updatedMember?.id
          ? updatedMember
          : { ...memberToPromote!, role: 'OWNER' };

        this.store.selectedOrganization.set({
          ...org,
          owners: [...org.owners.filter((o) => o.userId !== userId), promotedUser],
          members: org.members.filter((m) => m.userId !== userId),
        });
      },
    });
  }

  prepareDemoteOwner(userId: number, orgId: number): void {
    console.log('prepareDemoteOwner userId ', userId, ' orgId ', orgId);

    const org = this.store.selectedOrganization();
    if (!org || org.id !== orgId || org.owners.length <= 1) return;

    this.api.demoteOwnerToMember(userId, orgId).subscribe({
      next: (updatedMember: OrganizationMemberDto) => {
        const ownerToDemote = org.owners.find((o) => o.userId === userId);

        const demotedUser: OrganizationMemberDto = updatedMember?.id
          ? updatedMember
          : { ...ownerToDemote!, role: 'MEMBER' };

        this.store.selectedOrganization.set({
          ...org,
          owners: org.owners.filter((o) => o.userId !== userId),
          members: [...org.members, demotedUser],
        });
      },
    });
  }

  removeUserFromOrganization(userId: number, orgId: number): void {
    console.log('removeUserFromOrganization userId ', userId, ' orgId ', orgId);

    const org = this.store.selectedOrganization();
    console.log('org:');
    console.table(org);
    console.log('members:');
    console.table(org?.members);
    console.log('owners:');
    console.table(org?.owners);

    if (!org || org.id !== orgId) return;

    const isOwner = org.owners.some((o) => o.userId === userId);
    if (isOwner && org.owners.length <= 1) return;

    this.api.removeUserFromOrganization(userId, orgId).subscribe({
      next: () => {
        this.store.selectedOrganization.set({
          ...org,
          owners: org.owners.filter((o) => o.userId !== userId),
          members: org.members.filter((m) => m.userId !== userId),
        });

        this.refreshOrganizations();
      },
    });
  }

  prepareDeleteOrganization(orgId: number): void {
    if (!orgId) return;
    const org = this.store.allOrganizations().find((o) => o.id === orgId);
    if (!org) {
      console.error(`Organization with ID ${orgId} not found in allOrganizations.`);
      return;
    }
    this.store.selectedOrganization.set({
      ...org,
      owners: [...org.owners],
      members: [...org.members],
    });

    this.store.isModalDeleteOrganizationActive.set(true);
  }

  prepareDeleteMember(userId: number, orgId: number): void {
    this.removeUserFromOrganization(userId, orgId);
  }

  prepareDeleteOwner(userId: number, orgId: number): void {
    this.removeUserFromOrganization(userId, orgId);
  }

  prepareAddMember(orgId: number): void {
    if (!orgId) return;
    const org = this.store.allOrganizations().find((o) => o.id === orgId);
    if (!org) return;

    this.store.selectedOrganization.set({
      ...org,
      owners: [...org.owners],
      members: [...org.members],
    });

    this.store.isModalAddMemberActive.set(true);
  }

  prepareAddOwner(orgId: number): void {
    if (!orgId) return;
    const org = this.store.allOrganizations().find((o) => o.id === orgId);
    if (!org) return;

    this.store.selectedOrganization.set({
      ...org,
      owners: [...org.owners],
      members: [...org.members],
    });

    this.store.isModalAddOwnerActive.set(true);
  }

  confirmDeleteOrganization(): void {
    const org = this.store.selectedOrganization();
    if (!org) return;

    this.api.removeOrg(org.id).subscribe(() => {
      this.store.isModalDeleteOrganizationActive.set(false);
      this.store.selectedOrganization.set(null);
      this.store.isModalDeleteOrganizationSuccessActive.set(true);
    });
  }

  confirmDeleteMember(): void {
    const user = this.store.organizationListSelectedUser();
    const org = this.store.selectedOrganization();
    if (!user || !org) return;

    this.api.removeUserFromOrganization(user.id, org.id).subscribe(() => {
      this.store.isModalDeleteMemberActive.set(false);
      this.store.organizationListSelectedUser.set(null);
      this.store.selectedOrganization.set(null);
      this.store.isModalDeleteMemberSuccessActive.set(true);
      this.refreshOrganizations();
    });
  }

  confirmDeleteOwner(): void {
    const user = this.store.organizationListSelectedUser();
    const org = this.store.selectedOrganization();
    if (!user || !org || !user.id || !org.id) return;

    this.api.removeOwnerFromOrganization(user.id, org.id).subscribe(() => {
      this.store.isModalDeleteOwnerActive.set(false);
      this.store.organizationListSelectedUser.set(null);
      this.store.selectedOrganization.set(null);
      this.store.isModalDeleteOwnerSuccessActive.set(true);
      this.refreshOrganizations();
    });
  }

  getAllUsers() {
    const sortBy = this.store.currentSortBy();
    const sortDir = this.store.currentSortDir();
    const page = this.store.currentUsersPage();
    const size = this.store.currentUsersSize();
    const sortParam = `${sortBy},${sortDir}`;

    return this.api.getAllUsers(page, size, sortParam).subscribe({
      next: (pageData) => {
        this.store.usersPage.set(pageData);
      },
      error: (e) => console.error('Error fetching usersPage: ', e),
    });
  }

  changeUsersPage(newPage: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [this.store.usersPageQueryParamName()]: newPage },
      queryParamsHandling: 'merge',
    });
  }

  changeUsersSize(newSize: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [this.store.usersSizeQueryParamName()]: newSize,
        [this.store.usersPageQueryParamName()]: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  getUserByEmail(email: string) {
    this.api.getUserByEmail(email).subscribe({
      next: (u) => console.log('fetched user by email: ', u),
      error: (e) => console.log('error fetching user by email: ', e),
    });
  }

  // modals

  closeModals(): void {
    this.store.isAdminAddOrganizationModalActive.set(false);
    this.store.isModalAddOwnerActive.set(false);
    this.store.isModalAddMemberActive.set(false);
    this.store.isAdminAddOrganizationSuccessPopupActive.set(false);
    this.store.confirmMarkReservationAsCanceled.set(false);
    this.store.isModalDeleteOwnerActive.set(false);
    this.store.isModalDeleteMemberActive.set(false);
    this.store.isModalDeleteOrganizationActive.set(false);
    this.store.selectedBooking.set(null);
    this.store.isModalDeleteOrganizationSuccessActive.set(false);
    this.store.isModalDeleteMemberSuccessActive.set(false);
    this.store.isModalDeleteOwnerSuccessActive.set(false);
    this.store.displayBookingErrorPopup.set(false);
    this.store.globalErrorKey.set(null);
    this.store.isAddOrganizationModalActive.set(false);
    this.store.popupConfirmationActive.set(false);
    this.store.isModalAddRoomActive.set(false);
    this.store.confirmMarkReservationAsRequestCancel.set(false);
    this.store.globalErrorKey.set(null);
    this.store.isBanUsersModalActive.set(false);
    this.store.isBanUsersSuccessActive.set(false);
    this.store.isUserDetailsModalActive.set(false);
    this.store.displayBookingSuccesfulPopup.set(false);
    this.store.isOrganizationDetailsModalActive.set(false);
  }

  handleClickBanUsers() {
    this.store.isBanUsersModalActive.set(true);
  }

  handleAddOrganization() {
    this.store.isAdminAddOrganizationModalActive.set(true);
    this.router.navigate(['/admin/organizations']);
  }

  handleUserAddOrganization() {
    this.store.isAdminAddOrganizationModalActive.set(true);
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
          .reservations()
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

  postPriceForRoomId(roomId: number, resType: ReservationType, price: number) {
    this.store.pricingLoadingState.set({ roomId, type: resType });

    this.api
      .postPriceForRoomId(roomId, resType, price)
      .pipe(finalize(() => this.store.pricingLoadingState.set(null)))
      .subscribe({
        next: () => {
          this.getRooms();
        },
        error: (e) => {
          console.error('Error postPriceForRoomId: ', e);
        },
      });
  }

  isRoomRecordable(roomId: number, recordable: boolean) {
    this.api.isRoomRecordable(roomId, recordable).subscribe({
      next: () => {
        this.getRooms();
      },
      error: (e) => {
        console.error('Error isRoomRecordable: ', e);
      },
    });
  }

  setPreferredLanguage(language: string) {
    const user = this.authService.currentUser();

    if (user && user.email) {
      this.api.setPreferredLanguage(language).subscribe({
        next: () => {
          this.authService.updateUserLanguage(language);
          console.log(`set language for ${user.email}: ${language}`);
        },
        error: (e) => {
          console.error('Error setPreferredLanguage: ', e);
        },
      });
    }
  }
}
