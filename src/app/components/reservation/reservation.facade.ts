import { inject, Injectable } from '@angular/core';
import { ReservationApi } from './reservation.api';
import { ReservationStore } from './reservation.store';
import { CalendarHelper } from '../calendar/calendar.helper';
import { AuthService } from '../../auth/authService';
import { Router } from '@angular/router';
import { fetchEventSource } from '@microsoft/fetch-event-source';

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

    if (isAdmin) {
      this.getAllMembersAllOrganizations();
    } else {
      this.api
        .getOrganizationsOfUserWithMembers(0, this.store.orgsSize())
        .subscribe((pageData) => this.store.userOrganizations.set(pageData.content));
    }

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

    const payload = {
      reservedBy: booking.reservedByUserId,
      startAt: startAtDate.toISOString(),
      duration: `PT${booking.duration}H`,
      roomId: booking.roomId,
      behalfOf: booking.organizationId,
    };
    console.log('payload: ', payload);

    this.api.postReservation(payload).subscribe({
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
  getAllMembersAllOrganizations(page: number = 0) {
    this.api.getAllMembersAllOrganizations(page, this.store.orgsSize()).subscribe({
      next: (pageData) => {
        this.store.allOrganizations.set(pageData.content);
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
    this.getAllMembersAllOrganizations(newPage);
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
  createOrganization(name: string) {
    this.api.createOrganization(name).subscribe({
      next: () => {
        console.log(`Created organization ${name}`);
      },
      error: (e) => console.error(`Failed to create organization ${name}`, e),
    });
  }

  getOrganizationsOfUserWithMembers() {
    this.api.getOrganizationsOfUserWithMembers().subscribe({
      next: (data) => {
        this.store.userOrganizations.set(data.content);
        console.log('getOrganizationsOfUserWithMembers: ', data);
      },
      error: (e) => console.error('Failed to fetch organizations: ', e),
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
}
