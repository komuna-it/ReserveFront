import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Booking {
  date: string;      
  hour: number;      
  room: string;      
}

@Component({
  selector: 'calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.css']
})
export class CalendarPage {
  rooms = ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4'];
  selectedRoom = this.rooms[0];

  today = new Date();
  currentMonth = this.today.getMonth();
  currentYear = this.today.getFullYear();

  bookings: Booking[] = [
    { date: '2026-03-12', hour: 10, room: 'Sala 1' },
    { date: '2026-03-12', hour: 11, room: 'Sala 2' },
    { date: '2026-03-15', hour: 14, room: 'Sala 1' },
  ];

  daysInMonth: Date[] = [];

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
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  nextMonth() {
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
    const dayStr = day.toISOString().slice(0, 10);
    const existing = this.bookings.find(
      b => b.date === dayStr && b.hour === hour && b.room === this.selectedRoom
    );
    if (existing) {
      this.bookings = this.bookings.filter(b => b !== existing);
    } else {
      this.bookings.push({ date: dayStr, hour, room: this.selectedRoom });
    }
  }
}