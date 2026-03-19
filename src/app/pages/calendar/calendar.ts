import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface Booking {
  date: string;      
  hour: number;      
  room: string;      
}

@Component({
  selector: 'calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.css']
})
export class CalendarPage {

constructor(
  private auth: AuthService, 
  private http: HttpClient, 
  private router: Router
) {}

showAuthPopup = false;
  
  openAuthPopup() {
    this.showAuthPopup = true;
  }

  closeAuthPopup() {
    this.showAuthPopup = false;
  }

  rooms = ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4'];
  selectedRoom = this.rooms[0];
    monthString = ['Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien'];

  today = new Date();
  currentMonth = this.today.getMonth();
  currentYear = this.today.getFullYear();

  bookings: Booking[] = [
    { date: '2026-03-12', hour: 10, room: 'Sala 1' },
    { date: '2026-03-12', hour: 11, room: 'Sala 2' },
    { date: '2026-03-15', hour: 14, room: 'Sala 1' },
  ];

  daysInMonth: Date[] = [];

  selectedBooking: { date: string; hour: number; room?: string; duration?: number } | null = null;
  availableRooms: string[] = [];
  durationOptions = Array.from({length: 8}, (_, i) => i + 1); // 1–8 hours

  ngOnInit() {
    this.generateCalendar();
  }

  generateCalendar() {
    this.daysInMonth = [];
    const date = new Date(this.currentYear, this.currentMonth, 1);
    while (date.getMonth() === this.currentMonth) {
      this.daysInMonth.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
  }

  prevMonth() {
    console.log('prevMonth clicked');
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    console.log('nextMonth clicked');

    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
  }

  getBookingsForDay(day: Date) {
    const dayStr = day.toISOString().slice(0, 10);
    return this.bookings.filter(
      b => b.date === dayStr && b.room === this.selectedRoom
    ).map(b => b.hour);
  }

  toggleBooking(day: Date, hour: number) {
    console.log('toggleBooking day: ' + day + ',  hour: ' + hour);

    if (!this.auth.isLoggedIn()) {
          this.showAuthPopup = true;
      return;
    }
    const dayStr = day.toISOString().slice(0, 10);
    const existing = this.bookings.find(
      b => b.date === dayStr && b.hour === hour && b.room === this.selectedRoom
    );
    if (existing) {
      console.log('toggleBooking existing');
      this.bookings = this.bookings.filter(b => b !== existing);
    } else {
      console.log('toggleBooking NOT existing');
      this.bookings.push({ date: dayStr, hour, room: this.selectedRoom });
    }
  }

openBookingPopup(day: Date, hour: number) {
  const dayStr = day.toISOString().slice(0,10);

  // Calculate available rooms for selected hour + max 8 hours
  this.availableRooms = this.rooms.filter(room => {
    for (let h = 0; h < 8; h++) {
      if (this.bookings.find(b => b.date === dayStr && b.hour === hour + h && b.room === room)) {
        return false; // room not free
      }
    }
    return true;
  });

  if (this.availableRooms.length === 0) {
    alert('Brak wolnych sal w tym terminie');
    return;
  }

  this.selectedBooking = {
    date: dayStr,
    hour: hour,
    room: this.availableRooms[0],
    duration: 1
  };
}

confirmBooking() {
  if (!this.selectedBooking || !this.selectedBooking.room) {
    console.log('date or room not selected');
    return;
  }

  const { date, hour, room, duration } = this.selectedBooking;

  // If user is logged in, send booking to backend
  if (this.auth.isLoggedIn()) {
    for (let h = 0; h < duration!; h++) {
      const newBooking = { date, hour: hour + h, room: room! };
      console.log('Booking hour:', newBooking.hour, 'Room:', newBooking.room, 'Date:', newBooking.date);
      this.bookings.push(newBooking);  // local update
    }

    // Call backend API to save booking
    this.http.post(`${environment.apiUrl}/bookings`, { 
      date, 
      startHour: hour, 
      duration, 
      room, 
      userId: this.auth.getUser()?.id 
    }).subscribe({
      next: res => console.log('Booking saved to backend', res),
      error: err => console.error('Backend booking error', err)
    });

    this.selectedBooking = null;
  } else {
    // Not logged in → redirect to register
    this.router.navigate(['/register']);
  }
}}