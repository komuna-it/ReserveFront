import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Room } from '../../model/Room';
import { ReservationReq, ReservationResp } from '../../model/ReservationDto';
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

  readonly selectedRoomId = signal<number>(1);
  readonly selectedRoomNane = signal<string>('');
  readonly currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));
  readonly reservationRequests = signal<ReservationReq[]>([]);
  readonly reservationResponses = signal<ReservationResp[]>([]);
  readonly selectedBooking = signal<{
    date: string;
    hour: number;
    roomId: number;
    duration: number;
    roomName: string;
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

  readonly filteredReservations = computed(() => {
    const targetRoomId = this.selectedRoomId();
    return this.reservationResponses().filter((res) => res.roomId === targetRoomId);
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
    this.selectedRoomId.set(Number(selectElement.value));
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

      this.http.get<ReservationResp[]>(url).subscribe({
        next: (data) => {
          this.reservationResponses.set(data);
          console.log(
            'Received ' + data.length + ' reservation responses for room ' + room.id + ':',
          );
          console.log(data);
        },
        error: (e) => console.error('Failed to download reservation responses from backend: ', e),
      });
    }
  }

  isHourReserved(hour: number): boolean {
    const day = this.daySelectedByUser();

    return this.filteredReservations().some((res) => {
      const resStart = new Date(res.startAt);
      const isSameDay =
        resStart.getFullYear() === day.getFullYear() &&
        resStart.getMonth() === day.getMonth() &&
        resStart.getDate() === day.getDate();

      if (!isSameDay) return false;

      const startHour = resStart.getHours();
      const durationHours = this.parseDurationToHours(res.duration);
      return hour >= startHour && hour < startHour + durationHours;
    });
  }

  private parseDurationToHours(isoDuration: string): number {
    const hoursMatch = isoDuration.match(/(\d+)H/);
    return hoursMatch ? parseInt(hoursMatch[1], 10) : 1;
  }

  openBookingPopup(hour: number, roomId: number) {
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
      roomId: this.selectedRoomId(),
      duration: 1,
      roomName: this.rooms()[roomId].name,
    });
  }

  setDayByUser(day: Date) {
    console.log('user selected day:', day.getDate(), ' month: ', day.getMonth());
    this.daySelectedByUser.set(day);
  }

  confirmBooking() {
    const booking = this.selectedBooking();
    if (!booking) return;

    const payload = {
      roomId: booking.roomId,
      startAt: `${booking.date}T${String(booking.hour).padStart(2, '0')}:00:00`,
      duration: `PT${booking.duration}H`,
      reservedBy: 999,
    };

    const newReservation: ReservationReq = {
      roomId: payload.roomId,
      startAt: payload.startAt,
      duration: payload.duration,
      reservedBy: payload.reservedBy,
    };

    this.reservationRequests.update((list) => [...list, newReservation]);
    this.selectedBooking.set(null);
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
