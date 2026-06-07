import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Utils } from '../../services/utils';

@Component({
  selector: 'calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
})
export class CalendarPage implements OnInit, OnDestroy {
  readonly utils = inject(Utils);
  private sseController: AbortController | null = null;

  ngOnInit() {
    this.utils.fetchAllReservations();
    this.utils.connectToReservationStream();
    this.utils.fetchOrganizationsOfUser();
  }

  ngOnDestroy() {
    if (this.sseController) {
      this.sseController.abort();
    }
  }
}
