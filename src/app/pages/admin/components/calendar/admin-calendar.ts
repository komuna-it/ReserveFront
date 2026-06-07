import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Utils } from '../../../../services/utils';

@Component({
  selector: 'app-admin-calendar',
  imports: [CommonModule],
  templateUrl: './admin-calendar.html',
  styleUrl: './admin-calendar.css',
})
export class AdminCalendar {
  readonly utils = inject(Utils);

  ngOnInit() {
    this.utils.fetchReservationsForAllOrgsOfUser();
  }

  handleAdminReservationClick(hour: number, roomId: number) {
    console.log(`Clicked on hour ${hour} for room ${roomId}`);
  }
}
