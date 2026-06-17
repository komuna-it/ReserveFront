import { inject, Injectable } from '@angular/core';
import { ReservationApi } from './reservation.api';
import { ReservationStore } from './reservation.store';
import { CalendarHelper } from '../calendar/calendar.helper';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Organization } from '../../model/organization';
import { User } from '../../model/user';
import { OrganizationFront } from '../../model/organizationFront';

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
      this.api.getOrganizationsOfUser().subscribe((data) => this.store.userOrganizations.set(data));
    }

    this.connectToReservationStream();
  }

  getRoomsAndReservations() {
    this.api.getRooms().subscribe({
      next: (rooms) => {
        this.store.rooms.set(rooms);
      },
      error: (e) => {
        console.log('Error fetching rooms: ', e);
      },
    });

    this.api.getReservations().subscribe({
      next: (res) => {
        this.store.reservations.set(res);
      },
      error: (e) => {
        console.log('Error fetching res: ', e);
      },
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
      headers: { Authorization: `Bearer ${this.authService.accessToken()}` },
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
  getAllMembersAllOrganizations() {
    this.api.getAllMembersAllOrganizations().subscribe({
      next: (organizations) => {
        this.store.allOrganizations.set(organizations);
        console.log('getAllMembersAllOrganizations: ', organizations);
        console.log('this.store.allOrganizations(): ', this.store.allOrganizations());
      },
      error: () => console.error('Error in getAllMembersAllOrganizations'),
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
  getAllReservationsForUserAndTheirOrganization(userId: number) {
    this.api.getAllReservationsForUserAndTheirOrganization(userId).subscribe({
      next: (res) => {
        this.store.reservations.set(res);
      },
      error: (e) => {
        console.log('Error in getAllReservationsForUserAndTheirOrganization(): ', e);
      },
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

  getOrganizationsOfUser() {
    this.api.getOrganizationsOfUser().subscribe({
      next: (data) => {
        this.store.userOrganizations.set(data);
      },
      error: (e) => console.error('Failed to fetch organizations: ', e),
    });
  }
}
