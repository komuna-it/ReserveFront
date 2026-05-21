import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Room } from '../../model/Room';
import { ReservationDto } from '../../model/ReservationDto';

@Component({
  selector: 'calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
})
export class CalendarPage implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  // --- Stan Autentykacji ---
  // W prawdziwej aplikacji wartość ta byłaby pobierana z AuthService.
  // Zmień na 'false', aby przetestować automatyczne przekierowanie do logowania.
  readonly isLoggedIn = signal<boolean>(true);

  // --- Sygnały Stanu Kalendarza ---
  readonly rooms = signal<Room[]>([
    { id: 1, name: 'Sala 1' },
    { id: 2, name: 'Sala 2' },
    { id: 3, name: 'Sala 3' },
  ]);

  readonly selectedRoomId = signal<number>(1);
  readonly currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));
  readonly reservations = signal<ReservationDto[]>([]);
  readonly selectedBooking = signal<{
    date: string;
    hour: number;
    roomId: number;
    duration: number;
  } | null>(null);

  // --- Stałe konfiguracyjne ---
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
  readonly dayLabels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

  // --- Obliczenia reaktywne (Computed) ---
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
    return `${this.monthLabels[start.getMonth()]} ${start.getFullYear()}`;
  });

  readonly filteredReservations = computed(() => {
    const targetRoomId = this.selectedRoomId();
    return this.reservations().filter((res) => res.roomId === targetRoomId);
  });

  ngOnInit() {
    this.seedMockReservations();
    this.fetchReservations();
  }

  // --- Symulacja zajętych godzin (Mock Data) ---
  private seedMockReservations() {
    const today = new Date();

    // Generujemy przykładowe daty w formacie ISO dla bieżącego tygodnia
    const formatMockDate = (daysOffset: number, hour: number): string => {
      const d = this.getStartOfWeek(today);
      d.setDate(d.getDate() + daysOffset);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T${String(hour).padStart(2, '0')}:00:00`;
    };

    this.reservations.set([
      // Poniedziałek: Sala 1 zajęta od 10:00 na 2 godziny
      { id: 101, reservedBy: 12, roomId: 1, startAt: formatMockDate(0, 10), duration: 'PT2H' },
      // Poniedziałek: Sala 1 zajęta od 15:00 na 1 godzinę
      { id: 102, reservedBy: 15, roomId: 1, startAt: formatMockDate(0, 15), duration: 'PT1H' },
      // Środa: Sala 1 zajęta od 08:00 na 3 godziny
      { id: 103, reservedBy: 19, roomId: 1, startAt: formatMockDate(2, 8), duration: 'PT3H' },
      // Piątek: Sala 2 zajęta od 12:00 na 4 godziny
      { id: 104, reservedBy: 22, roomId: 2, startAt: formatMockDate(4, 12), duration: 'PT4H' },
    ]);
  }

  // --- Obsługa Logiki biznesowej i Akcji ---
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
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

  fetchReservations() {
    // Tutaj normalnie strzelasz do backendu i uzupełniasz dane:
    // this.http.get<ReservationDto[]>(`${environment.apiUrl}/bookings`)...
  }

  isHourReserved(day: Date, hour: number): boolean {
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

  openBookingPopup(day: Date, hour: number) {
    // KROK ZABEZPIECZAJĄCY: Jeśli użytkownik jest niezalogowany, przekieruj do logowania
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dateStr = String(day.getDate()).padStart(2, '0');

    this.selectedBooking.set({
      date: `${year}-${month}-${dateStr}`,
      hour: hour,
      roomId: this.selectedRoomId(),
      duration: 1,
    });
  }

  confirmBooking() {
    const booking = this.selectedBooking();
    if (!booking) return;

    const payload = {
      roomId: booking.roomId,
      startAt: `${booking.date}T${String(booking.hour).padStart(2, '0')}:00:00`,
      duration: `PT${booking.duration}H`,
      reservedBy: 999, // ID zalogowanego usera
    };

    // Po udanym zapisie na backendzie, dodajemy rezerwację lokalnie do sygnału:
    const newReservation: ReservationDto = {
      id: Math.random(), // tymczasowe ID frontowe
      roomId: payload.roomId,
      startAt: payload.startAt,
      duration: payload.duration,
      reservedBy: payload.reservedBy,
    };

    this.reservations.update((list) => [...list, newReservation]);
    this.selectedBooking.set(null);
  }
}
