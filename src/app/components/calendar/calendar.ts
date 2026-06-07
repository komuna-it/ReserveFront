import { Component, inject, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarHelper } from './calendar.helper';
import { ReservationStore } from '../reservation/reservation.store';
import { ReservationFacade } from '../reservation/reservation.facade';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
})
export class CalendarComponent implements OnInit, OnDestroy {
  readonly helper = inject(CalendarHelper);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);

  @Input() mode: 'user' | 'admin' = 'user';

  ngOnInit() {
    this.facade.initializeCalendar(this.mode === 'admin');
  }

  ngOnDestroy() {
    this.facade.disconnectStream();
  }
}
