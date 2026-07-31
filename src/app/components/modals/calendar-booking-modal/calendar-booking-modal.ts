import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CalendarHelper } from '../../calendar/calendar.helper';
import { AuthService } from '../../../auth/authService';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { ReservationStore } from '../../reservation/reservation.store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddOrganizationModal } from '../add-organization-modal/add-organization-modal';

@Component({
  selector: 'app-calendar-booking-modal',
  imports: [CommonModule, FormsModule, TranslocoPipe, AddOrganizationModal],
  templateUrl: './calendar-booking-modal.html',
  styleUrl: './calendar-booking-modal.css',
})
export class CalendarBookingModal {
  translocoService = inject(TranslocoService);
  readonly helper = inject(CalendarHelper);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);

  managePrivateReservationCheckbox() {
    if (this.store.userOrganizations().length === 0) {
      this.store.privateReservationCheckbox.set(true);
    }
  }

  handleAddOrganizationModal() {
    this.store.modalAddOrganizationActive.set(true);
  }

  isPrivateCheckboxDisabled() {
    return this.store.userOrganizations().length === 0 || this.store.privateReservationCheckbox();
  }
}
