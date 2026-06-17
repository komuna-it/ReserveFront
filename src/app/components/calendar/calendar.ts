import { Component, inject, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarHelper } from './calendar.helper';
import { ReservationStore } from '../reservation/reservation.store';
import { ReservationFacade } from '../reservation/reservation.facade';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CalendarComponent, CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './calendar.html',
})
export class CalendarComponent implements OnInit, OnDestroy {
  translocoService = inject(TranslocoService);
  readonly helper = inject(CalendarHelper);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);

  ngOnInit() {
    this.facade.initializeCalendar(this.store.isAdminMode());
    console.log('isAdmin: ', this.store.isAdminMode());
  }

  ngOnDestroy() {
    this.facade.disconnectStream();
  }
}
