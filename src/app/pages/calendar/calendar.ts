import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';
import { Room } from './../../model/Room';
import { ReservationDto } from '../../model/ReservationDto';

@Component({
  selector: 'calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
})
export class CalendarPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  // --- Signals (State Management) ---
  readonly rooms = signal<Room[]>([
    { id: 1, name: 'Sala 1' },
    { id: 2, name: 'Sala 2' },
    { id: 3, name: 'Sala 3' },
    { id: 4, name: 'Sala 4' },
  ]);

  readonly selectedRoomId = signal<number>(1);
  readonly currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));
  readonly reservations = signal<ReservationDto[]>([]);

  // Selection state for reservation modal
  readonly selectedBooking = signal<{
    date: string;
    hour: number;
    roomId: number;
    duration: number;
  } | null>(null);

  // --- Constants ---
  readonly hoursRange = Array.from({ length: 14 }, (_, i) => i + 8); // [8, 9, ..., 21]
  readonly durationOptions = Array.from({ length: 8 }, (_, i) => i + 1); // [1, 2, ..., 8]
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

  // --- Computed States (Deriving Data Automatically) ---

  // Generates the 7 days array for the current week view
  readonly weekDays = computed(() => {
    const start = this.currentWeekStart();
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  });

  // Display label for the current week header (e.g., "Maj 2026")
  readonly currentWeekLabel = computed(() => {
    const start = this.currentWeekStart();
    return `${this.monthLabels[start.getMonth()]} ${start.getFullYear()}`;
  });

  // Filter reservations based on active room selection
  readonly filteredReservations = computed(() => {
    const targetRoomId = this.selectedRoomId();
    return this.reservations().filter((res) => res.roomId === targetRoomId);
  });

  ngOnInit() {
    this.fetchReservations();
  }

  // --- Methods & Actions ---

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Set to Monday
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
  }

  navigateWeek(direction: 'prev' | 'next') {
    const current = new Date(this.currentWeekStart());
    const daysOffset = direction === 'next' ? 7 : -7;
    current.setDate(current.getDate() + daysOffset);
    this.currentWeekStart.set(current);
    this.fetchReservations();
  }

  onRoomChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedRoomId.set(Number(selectElement.value));
  }

  fetchReservations() {
    // You can filter by currentWeekStart if your API supports pagination windowing
    this.http.get<ReservationDto[]>(`${environment.apiUrl}/bookings`).subscribe({
      next: (data) => this.reservations.set(data),
      error: (err) => console.error('Failed to fetch reservations', err),
    });
  }

  /**
   * Evaluates if a specific time slot is locked by an existing backend reservation
   */
  isHourReserved(day: Date, hour: number): boolean {
    return this.filteredReservations().some((res) => {
      const resStart = new Date(res.startAt);

      // Match calendar slot date to reservation start date
      const isSameDay =
        resStart.getFullYear() === day.getFullYear() &&
        resStart.getMonth() === day.getMonth() &&
        resStart.getDate() === day.getDate();

      if (!isSameDay) return false;

      const startHour = resStart.getHours();
      const durationHours = this.parseDurationToHours(res.duration);

      // Slot is blocked if it falls within the span [startHour, startHour + duration)
      return hour >= startHour && hour < startHour + durationHours;
    });
  }

  private parseDurationToHours(isoDuration: string): number {
    // Basic regex parser for ISO-8601 strings like "PT1H" or "PT90M"
    const hoursMatch = isoDuration.match(/(\d+)H/);
    const minutesMatch = isoDuration.match(/(\d+)M/);

    let hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    if (minutesMatch) {
      hours += parseInt(minutesMatch[1], 10) / 60;
    }
    return hours || 1; // Fallback default to 1 hour
  }

  openBookingPopup(day: Date, hour: number) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/register']);
      return;
    }

    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dateStr = String(day.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dateStr}`;

    this.selectedBooking.set({
      date: formattedDate,
      hour: hour,
      roomId: this.selectedRoomId(),
      duration: 1,
    });
  }

  confirmBooking() {
    const booking = this.selectedBooking();
    if (!booking) return;

    // Build the exact payload shape backend requires
    const payload = {
      roomId: booking.roomId,
      startAt: `${booking.date}T${String(booking.hour).padStart(2, '0')}:00:00`,
      duration: `PT${booking.duration}H`, // backend Java Duration format converter
      reservedBy: this.auth.getUser()?.id || 0,
    };

    this.http.post<ReservationDto>(`${environment.apiUrl}/bookings`, payload).subscribe({
      next: (newRes) => {
        // Optimistically append new reservation to client state directly
        this.reservations.update((currentList) => [...currentList, newRes]);
        this.selectedBooking.set(null);
      },
      error: (err) => console.error('Error handling creation sync', err),
    });
  }

  closeModal() {
    this.selectedBooking.set(null);
  }
}
