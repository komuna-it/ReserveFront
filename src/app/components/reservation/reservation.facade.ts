import { inject, Injectable } from '@angular/core';
import { ReservationApi } from './reservation.api';
import { ReservationStore } from './reservation.store';
import { CalendarHelper } from '../calendar/calendar.helper';
import { AuthService } from '../../services/auth';
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
    this.store.isAdminMode.set(isAdmin);
    this.fetchRoomsAndReservations();

    if (isAdmin) {
      this.api.getAllOrganizations().subscribe((data) => this.store.allOrganizations.set(data));
    } else {
      this.api.getOrganizationsOfUser().subscribe((data) => this.store.userOrganizations.set(data));
    }

    this.connectToReservationStream();
  }

  fetchRoomsAndReservations() {
    this.api.getRooms().subscribe({
      next: (rooms) => {
        this.store.rooms.set(rooms);
        this.store.reservations.set([]);
        for (const room of rooms) {
          this.api.getReservationsByRoom(room.id).subscribe({
            next: (data) =>
              this.store.reservations.update((prev) => {
                const combined = [...prev, ...data];
                return Array.from(new Map(combined.map((r) => [r.id, r])).values());
              }),
          });
        }
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
        this.fetchRoomsAndReservations();
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
    const current = new Date(this.store.currentWeekStart());
    current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    this.store.currentWeekStart.set(current);
    this.store.daySelectedByUser.set(current);
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
          this.fetchRoomsAndReservations();
        }
        if (msg.event === 'RESERVATION_CREATED' && reservedBy !== `${this.authService.userId}`) {
          this.store.displayBookingErrorPopup();
        }
      },
    });
  }

  disconnectStream() {
    if (this.sseController) {
      this.sseController.abort();
      this.sseController = null;
    }
  }
}
