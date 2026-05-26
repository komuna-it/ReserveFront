import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Room } from '../../model/Room';
import { ReservationDto as ReservationDto } from '../../model/ReservationDto';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
})
export class CalendarPage implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);
  readonly getAllRoomsEndpoint = `${environment.apiUrl}/room/all`;
  readonly getReservationsByRoomEndpoint = `${environment.apiUrl}/reservation/room`;
  readonly rooms = signal<Room[]>([]);
  readonly daySelectedByUser = signal<Date>(new Date());

  getRoomsFromBackend() {
    this.http.get<Room[]>(this.getAllRoomsEndpoint).subscribe({
      next: (data) => {
        this.rooms.set(data);
        console.log('Received rooms from server:');
        console.log(data);
        this.fetchReservations();
      },
      error: (e) => console.error('Failed to download rooms from backend: ', e),
    });
    return this.rooms;
  }

  readonly roomIdSelectedByUser = signal<number>(1);
  readonly selectedRoomNane = signal<string>('');
  readonly currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));
  readonly reservationRequests = signal<ReservationDto[]>([]);
  readonly reservationResponses = signal<ReservationDto[]>([]);
  readonly selectedBooking = signal<{
    date: string;
    hour: number;
    roomId: number;
    duration: number;
    roomName: string | undefined;
  } | null>(null);

  readonly hoursRange = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 do 21:00
  readonly durationOptions = Array.from({ length: 8 }, (_, i) => i + 1); // 1-8h
  readonly monthLabels = [
    'Styczeń',
    'Luty',
    'Marzec',
    'Kwiecień',
    'Maj',
    'Czerwiec',
    'Lipiec',
    'Sierpień',
    'Wrzesień',
    'Październik',
    'Listopad',
    'Grudzień',
  ];

  isMoreThanOneMonth(week: Date[]) {}

  readonly dayLabels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
  selectedDay = signal<Date | null>(null);
  workingHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  readonly weekDays = computed(() => {
    const start = this.currentWeekStart();
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  });

  readonly currentWeekLabel = computed(() => {
    const start = this.currentWeekStart();
    const startMonth = start.getMonth();

    const lastDayInWeek = new Date(start);
    lastDayInWeek.setDate(start.getDate() + 6);

    const endMonth = lastDayInWeek.getMonth();

    if (startMonth === endMonth) {
      return `${this.monthLabels[start.getMonth()]} ${start.getFullYear()}`;
    }

    return `${this.monthLabels[startMonth]} - ${this.monthLabels[lastDayInWeek.getMonth()]} ${start.getFullYear()}`;
  });

  ngOnInit() {
    this.getRoomsFromBackend();
  }
  // kolorek  przycisku dnia (select)
  isSelectedDay(day: Date): boolean {
    const selected = this.selectedDay();

    if (!selected) return false;

    return (
      day.getDate() === selected.getDate() &&
      day.getMonth() === selected.getMonth() &&
      day.getFullYear() === selected.getFullYear()
    );
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
  }

  getDayOfWeekFromDayPolish(day: Date) {
    const dayOfWeek = String(day).substring(0, 3);
    switch (dayOfWeek) {
      case 'Mon':
        return 'Pon';
      case 'Tue':
        return 'Wt';
      case 'Wed':
        return 'Śr';
      case 'Thu':
        return 'Czw';
      case 'Fri':
        return 'Pt';
      case 'Sat':
        return 'Sob';
      case 'Sun':
        return 'Ndz';
    }
    return dayOfWeek;
  }

  navigateWeek(direction: 'prev' | 'next') {
    const current = new Date(this.currentWeekStart());
    current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    this.currentWeekStart.set(current);
    this.fetchReservations();
  }

  onRoomChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.roomIdSelectedByUser.set(Number(selectElement.value));
  }

  getReservationsForDay(day: Date) {
    this.selectedDay.set(day);
  }

  fetchReservations() {
    console.log('inside fetchReservations, rooms length : ', this.rooms().length);
    if (this.rooms().length === 0) {
      console.error('No rooms available after fetch attempt. Cannot fetch reservations.');
      return;
    }
    for (const room of this.rooms()) {
      const url = `${this.getReservationsByRoomEndpoint}/${room.id}`;
      console.log('fetching reservations with url: ', url);
      this.reservationResponses.set([]);

      this.http.get<ReservationDto[]>(url).subscribe({
        next: (data) => {
          this.reservationResponses.update((prev) => [...prev, ...data]);
          console.log(
            'Received ' + data.length + ' reservation responses for room ' + room.id + ':',
          );
          console.log(data);
        },
        error: (e) => console.error('Failed to download reservation responses from backend: ', e),
      });
    }
  }

  isHourReserved(hour: number, checkingRoomId: number): boolean {
    for (const existingReservation of this.reservationResponses()) {
      if (existingReservation.roomId === checkingRoomId) {
        const checkingDay = this.daySelectedByUser();
        // check day
        const reservationStart = new Date(existingReservation.startAt);
        if (checkingDay.getDate() === reservationStart.getDate()) {
          const isSameDay =
            reservationStart.getFullYear() === checkingDay.getFullYear() &&
            reservationStart.getMonth() === checkingDay.getMonth() &&
            reservationStart.getDate() === checkingDay.getDate();
          if (!isSameDay) return false;

          // check hour
          const existingReservationStartHour = reservationStart.getHours();
          const durationHours = this.parseDurationToHours(existingReservation.duration);

          if (
            hour >= existingReservationStartHour &&
            hour < existingReservationStartHour + durationHours
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private parseDurationToHours(isoDuration: string): number {
    const hoursMatch = isoDuration.match(/(\d+)H/);
    return hoursMatch ? parseInt(hoursMatch[1], 10) : 1;
  }

  openBookingPopup(hour: number, roomId: number) {
    console.log('Opening booking popup for hour: ', hour, ' roomId: ', roomId);
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const day = this.daySelectedByUser();
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dateStr = String(day.getDate()).padStart(2, '0');

    this.selectedBooking.set({
      date: `${year}-${month}-${dateStr}`,
      hour: hour,
      roomId: roomId,
      duration: 1,
      roomName: this.rooms().find((r) => r.id === roomId)?.name,
    });
  }

  setDayByUser(day: Date) {
    console.log('user selected day:', day.getDate(), ' month: ', day.getMonth());
    this.daySelectedByUser.set(day);
  }

  confirmBooking() {
    const booking = this.selectedBooking();
    console.log('Confirming booking: ', booking);
    if (!booking) return;

    const payload = {
      id: null,
      behalfOf: 1,
      roomId: booking.roomId,
      startAt: `${booking.date}T${String(booking.hour).padStart(2, '0')}:00:00`,
      duration: `PT${booking.duration}H`,
      reservedBy: 1,
    };
    console.log('Constructed payload for reservation: ', payload);
    const newReservation: ReservationDto = {
      id: payload.id,
      behalfOf: payload.behalfOf,
      roomId: payload.roomId,
      startAt: payload.startAt,
      duration: payload.duration,
      reservedBy: payload.reservedBy,
    };
    console.log('Creating reservation with payload: ', payload);
    this.http.post<ReservationDto>(`${environment.apiUrl}/reservation`, payload).subscribe({
      next: (response) => {
        console.log('Reservation created successfully:', response);
        this.reservationRequests.update((requests) => [...requests, response]);
      },
      error: (e) => console.error('Failed to create reservation: ', e),
    });
    this.selectedBooking.set(null);
    this.reservationResponses.update((prev) => [...prev, newReservation]);
  }

  handleBookingClick(hour: number, roomId: number) {
    console.log('handleBookingClick hour ' + hour + ' roomId ' + roomId);
    if (this.authService.isLoggedIn()) {
      this.openBookingPopup(hour, roomId);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
