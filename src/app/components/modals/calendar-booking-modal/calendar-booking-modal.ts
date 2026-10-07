import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CalendarHelper } from '../../calendar/calendar.helper';
import { AuthService } from '../../../auth/authService';
import { ReservationFacade } from '../../../services/reservation/reservation.facade';
import { ReservationStore } from '../../../services/reservation/reservation.store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddOrganizationModal } from '../add-organization-modal/add-organization-modal';
import { ReservationType } from '../../../model/reservationType';
import { Booking } from '../../../model/booking';
import { User } from '../../../model/user';
import { OrganizationFacade } from '../../../services/organization/organization.facade';
import { UserFacade } from '../../../services/user/user.facade';
import { UserStore } from '../../../services/user/user.store';
import { ViewController } from '../../../services/view/view.controller';
import { ViewStore } from '../../../services/view/view.store';
import { OrganizationStore } from '../../../services/organization/organization.store';

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
  readonly userStore = inject(UserStore);
  readonly organizationStore = inject(OrganizationStore);
  readonly facade = inject(ReservationFacade);
  readonly organizationFacade = inject(OrganizationFacade);
  readonly userFacade = inject(UserFacade);
  readonly authService = inject(AuthService);
  readonly booking = this.store.selectedBooking();
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);

  constructor() {
    effect(() => {
      const orgs = this.organizationStore.organizations();
      const booking = this.store.selectedBooking();
      const isAdmin = this.authService.isAdmin();
      const user = this.userStore.selectedUser();

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
    this.organizationFacade.refreshOrganizations();

    if (this.authService.isAdmin()) {
      this.userFacade.getAllUsers();
    }
  }

  onUserIdSelected(userId: User): void {
    const id = Number(userId);
    const user = this.userStore.users().find((u) => u.id === id);
    if (!user) return;
    this.userStore.selectedUser.set(user);
    if (this.isAdminOrManagerSelected()) {
      this.organizationFacade.getOrganizations(true, null);
    } else {
      this.organizationFacade.getOrganizations(false, user.id);
    }
    if (this.booking) {
      this.booking.reservedByUserId = user.id;
    }
  }

  isAdminOrManagerSelected = computed(() => {
    const adminAndManagersUserIds = new Set<number>();
    const userAndManagers = this.userStore
      .users()
      .filter((u) => u.role === 'ADMIN' || u.role === 'MANAGER')
      .every((u) => adminAndManagersUserIds.add(u.id));

    const user = this.userStore.selectedUser();
    if (!user) return false;
    if (adminAndManagersUserIds.has(user.id)) {
      return true;
    }
    return false;
  });

  handleAddOrganizationModal() {
    this.viewStore.isAddOrganizationModalActive.set(true);
  }

  togglePrivateReservationCheckbox() {
    if (this.isPrivateReservationForced()) {
      return;
    }

    const isPrivateNow = this.store.isPrivateReservationCheckboxActivated();
    this.store.isPrivateReservationCheckboxActivated.set(!isPrivateNow);

    const booking = this.store.selectedBooking();
    const orgs = this.organizationStore.organizations();
    if (!isPrivateNow && booking && !booking.organizationId && orgs.length > 0) {
      booking.organizationId = orgs[0].id;
    }
  }

  isPrivateReservationForced() {
    return this.organizationStore.organizations().length === 0;
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
