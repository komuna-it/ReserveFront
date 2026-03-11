import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'calendar-page',
  standalone: true,
  imports: [NgFor],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.css']
})
export class CalendarPage {
  days = Array.from({ length: 31 }, (_, i) => i + 1);
}