import { Component, effect, inject, OnInit, signal } from '@angular/core';
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
export class CalendarBookingModal implements OnInit {
  translocoService = inject(TranslocoService);
  readonly helper = inject(CalendarHelper);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);

  constructor() {
    effect(() => {
      const orgs = this.store.organizations();
      const booking = this.store.selectedBooking();

      if (orgs.length === 0) {
        this.store.isPrivateReservationCheckboxActivated.set(true);
      } else {
        this.store.isPrivateReservationCheckboxActivated.set(false);

        if (
          booking &&
          (!booking.organizationId || !orgs.some((org) => org.id === booking.organizationId))
        ) {
          booking.organizationId = orgs[0].id;
        }
      }
    });

    if (this.store.reservationTypeOptions().length > 0) {
      this.store.reservationTypeBooking.set(this.store.reservationTypeOptions()[0]);
    }
  }
  ngOnInit() {
    console.log('opening CalendarBookingModal');
    this.facade.refreshOrganizations();
  }
  managePrivateReservationCheckbox() {
    if (this.store.organizations().length === 0) {
      this.store.isPrivateReservationCheckboxActivated.set(true);
    }
  }

  handleAddOrganizationModal() {
    this.store.isAddOrganizationModalActive.set(true);
  }

  isPrivateCheckboxDisabled() {
    return (
      this.store.organizations().length === 0 && this.store.isPrivateReservationCheckboxActivated()
    );
  }

  togglePrivateReservationCheckbox() {
    const orgs = this.store.organizations();
    if (orgs.length === 0) {
      return;
    }

    const isPrivateNow = !this.store.isPrivateReservationCheckboxActivated();
    this.store.isPrivateReservationCheckboxActivated.set(isPrivateNow);

    const booking = this.store.selectedBooking();
    if (!isPrivateNow && booking && !booking.organizationId && orgs.length > 0) {
      booking.organizationId = orgs[0].id;
    }
  }
  isPrivateReservationCheckboxDisabled() {
    return this.store.organizations().length === 0;
  }
}
