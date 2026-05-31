import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReservationDto } from '../../model/reservationDto';
import { HourWrapper } from '../../model/hourWrapper';
import { Room } from '../../model/room';
import { AuthService } from '../../services/auth';
import { fetchEventSource } from '@microsoft/fetch-event-source';

@Component({
  selector: 'calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
})
export class CalendarPage implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);
  private eventSource: EventSource | null = null;
  private sseController: AbortController | null = null;

  readonly apiUrl = process.env['VSF_API_URL'] || '';
  readonly getAllRoomsEndpoint = `${this.apiUrl}/room/all`;
  readonly getReservationsByRoomEndpoint = `${this.apiUrl}/reservation/room`;
  readonly sseReservationEndpoint = `${this.apiUrl}/reservation/sse`;
  readonly postReservationEndpoint = `${this.apiUrl}/reservation`;

  readonly rooms = signal<Room[]>([]);
  readonly reservationResponses = signal<ReservationDto[]>([]);
  readonly daySelectedByUser = signal<Date>(new Date());
  readonly currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));
  readonly currentMonthDate = signal<Date>(new Date());
  readonly accessToken = computed(() => this.authService.accessToken());
  readonly selectedBooking = signal<{
    date: string;
    hour: number;
    roomId: number;
    duration: number;
    roomName: string | undefined;
  } | null>(null);
  readonly displayBookingSuccesfulPopup = signal<boolean>(false);

  readonly hoursRange = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 21:00
  readonly durationOptions = Array.from({ length: 8 }, (_, i) => i + 1); // max 8 hs
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
  readonly weekDayLabels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

  readonly weekDays = computed(() => {
    const start = this.currentWeekStart();
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  });

  readonly monthGridDays = computed(() => {
    const viewDate = this.currentMonthDate();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    let startOffset = firstDayOfMonth.getDay();
    if (startOffset === 0) startOffset = 7;

    const startGridDate = new Date(firstDayOfMonth);
    startGridDate.setDate(firstDayOfMonth.getDate() - (startOffset - 1));

    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(startGridDate);
      day.setDate(startGridDate.getDate() + i);
      return day;
    });
  });

  readonly currentMonthLabel = computed(() => {
    const date = this.currentMonthDate();
    return `${this.monthLabels[date.getMonth()]} ${date.getFullYear()}`;
  });

  readonly currentWeekLabel = computed(() => {
    const start = this.currentWeekStart();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    if (start.getMonth() === end.getMonth()) {
      return `${this.monthLabels[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${this.monthLabels[start.getMonth()]} - ${this.monthLabels[end.getMonth()]} ${start.getFullYear()}`;
  });

  readonly tableRows = computed(() => {
    const selectedDate = this.daySelectedByUser();
    const reservations = this.reservationResponses();
    const roomsList = this.rooms();
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfSelected = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    );
    const isPastDay = startOfSelected < startOfToday;
    const isToday = startOfSelected.getTime() === startOfToday.getTime();

    return this.hoursRange.map((hour) => {
      const cells = roomsList.map((room) => {
        const isPastHour = isPastDay || (isToday && hour <= now.getHours());

        const isReserved = reservations.some((res) => {
          if (res.roomId !== room.id) return false;
          const resStart = new Date(res.startAt);

          const isSameDay =
            resStart.getFullYear() === selectedDate.getFullYear() &&
            resStart.getMonth() === selectedDate.getMonth() &&
            resStart.getDate() === selectedDate.getDate();

          if (!isSameDay) return false;

          const startHour = resStart.getHours();
          const duration = this.parseDurationToHours(res.duration);
          return hour >= startHour && hour < startHour + duration;
        });

        const isDisabled = isReserved || isPastHour;

        return {
          roomId: room.id,
          hourWrapper: new HourWrapper(hour, isDisabled, false),
        };
      });

      return { hour, cells };
    });
  });

  ngOnInit() {
    this.fetchRoomsAndReservations();
    this.connectToReservationStream();
  }

  selectDay(day: Date) {
    this.daySelectedByUser.set(day);
    this.currentWeekStart.set(this.getStartOfWeek(day));
    this.currentMonthDate.set(new Date(day.getFullYear(), day.getMonth(), 1));
  }

  isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
  }

  navigateWeek(direction: 'prev' | 'next') {
    const current = new Date(this.currentWeekStart());
    current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    this.currentWeekStart.set(current);
    this.daySelectedByUser.set(current);
  }

  navigateMonth(direction: 'prev' | 'next') {
    const d = new Date(this.currentMonthDate());
    d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
    this.currentMonthDate.set(d);
  }

  fetchRoomsAndReservations() {
    const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });

    this.http.get<Room[]>(this.getAllRoomsEndpoint, { headers: header }).subscribe({
      next: (data) => {
        this.rooms.set(data);
        this.fetchReservations();
      },
      error: (e) => console.error('Failed to download rooms: ', e),
    });
  }

  fetchReservations() {
    if (this.rooms().length === 0) return;
    const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });

    this.reservationResponses.set([]);
    for (const room of this.rooms()) {
      const url = `${this.getReservationsByRoomEndpoint}/${room.id}`;
      this.http.get<ReservationDto[]>(url, { headers: header }).subscribe({
        next: (data) => {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const filteredData = data.filter((res) => new Date(res.startAt) >= startOfToday);

          this.reservationResponses.update((prev) => [...prev, ...filteredData]);
        },
        error: (e) => console.error('Failed to download reservations: ', e),
      });
    }
  }

  private parseDurationToHours(isoDuration: string): number {
    const hoursMatch = isoDuration.match(/(\d+)H/);
    return hoursMatch ? parseInt(hoursMatch[1], 10) : 1;
  }

  handleBookingClick(hour: number, roomId: number) {
    if (!this.authService.isAuthenticated()) {
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

  confirmBooking() {
    const booking = this.selectedBooking();
    if (!booking) return;

    const payload = {
      id: null,
      behalfOf: 1,
      roomId: booking.roomId,
      startAt: `${booking.date}T${String(booking.hour).padStart(2, '0')}:00:00`,
      duration: `PT${booking.duration}H`,
      reservedBy: 1,
    };
    const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });

    this.http
      .post<ReservationDto>(this.postReservationEndpoint, payload, { headers: header })
      .subscribe({
        next: (response) => {
          this.reservationResponses.update((prev) => [...prev, response]);
          this.displayBookingSuccesfulPopup.set(true);
          this.selectedBooking.set(null);
        },
        error: (e) => console.error('Failed to create reservation: ', e),
      });
  }

  private connectToReservationStream() {
    this.sseController = new AbortController();

    fetchEventSource(this.sseReservationEndpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.authService.accessToken()}`,
      },
      signal: this.sseController.signal,
      onmessage: (msg) => {
        if (msg.event === 'RESERVATION_CREATED') {
          console.log('Wykryto nową rezerwację przez SSE, odświeżam listę...');
          this.fetchReservations();
        }
      },
      onerror: (err) => {
        console.error('SSE error:', err);
      },
    });
  }

  ngOnDestroy() {
    if (this.sseController) {
      this.sseController.abort();
    }
  }
}
