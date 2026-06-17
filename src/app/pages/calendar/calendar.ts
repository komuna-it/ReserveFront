import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { CalendarHelper } from '../../components/calendar/calendar.helper';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { CalendarComponent } from '../../components/calendar/calendar';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'calendar-page',
  standalone: true,
  imports: [CalendarComponent, CommonModule, FormsModule],
  templateUrl: './calendar.html',
})
export class CalendarPage implements OnInit {
  ngOnInit() {}
}
