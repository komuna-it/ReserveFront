import { Component, effect, inject, OnInit } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CalendarHelper } from '../../calendar/calendar.helper';
import { AuthService } from '../../../auth/authService';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { ReservationStore } from '../../reservation/reservation.store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddOrganizationModal } from '../add-organization-modal/add-organization-modal';
import { ReservationType } from '../../../model/reservationType';
import { Booking } from '../../../model/booking';

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

  constructor() {
    effect(() => {
      const orgs = this.store.organizations();
      const booking = this.store.selectedBooking();
      const isAdmin = this.authService.isAdmin();

      if (!isAdmin && orgs.length === 0) {
        this.store.isPrivateReservationCheckboxActivated.set(true);
      } else if (!isAdmin) {
        this.store.isPrivateReservationCheckboxActivated.set(false);
      }

      if (
        booking &&
        orgs.length > 0 &&
        (!booking.organizationId || !orgs.some((org) => org.id === booking.organizationId))
      ) {
        booking.organizationId = orgs[0].id;
      }
    });

    if (this.store.reservationTypeOptions().length > 0) {
      this.store.selectedReservationType.set(this.store.reservationTypeOptions()[0]);
    }

    console.log('opening CalendarBookingModal');
    this.facade.refreshOrganizations();

    if (this.authService.isAdmin()) {
      this.facade.getAllUsers();
    }
  }

  handleAddOrganizationModal() {
    this.store.isAddOrganizationModalActive.set(true);
  }

  togglePrivateReservationCheckbox() {
    if (this.isPrivateReservationCheckboxDisabled()) {
      return;
    }

    const isPrivateNow = !this.store.isPrivateReservationCheckboxActivated();
    this.store.isPrivateReservationCheckboxActivated.set(isPrivateNow);

    const booking = this.store.selectedBooking();
    const orgs = this.store.organizations();
    if (!isPrivateNow && booking && !booking.organizationId && orgs.length > 0) {
      booking.organizationId = orgs[0].id;
    }
  }

  isPrivateReservationCheckboxDisabled() {
    if (this.authService.isAdmin()) {
      return false;
    }
    return this.store.organizations().length === 0;
  }

  updateDuration(duration: number): void {
    this.store.selectedBooking.update((booking) =>
      booking ? { ...booking, duration: Number(duration) } : null,
    );
  }

  updateReservationType(type: ReservationType): void {
    this.store.selectedBooking.update((booking) =>
      booking ? { ...booking, reservationType: type } : null,
    );
  }
}
