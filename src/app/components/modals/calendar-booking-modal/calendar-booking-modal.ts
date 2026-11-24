import { Component, effect, inject, isDevMode, untracked } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CalendarHelper } from '../../calendar/calendar.helper';
import { AuthService } from '../../../auth/authService';
import { ReservationFacade } from '../../../services/reservation/reservation.facade';
import { ReservationStore } from '../../../services/reservation/reservation.store';
import { OrganizationFacade } from '../../../services/organization/organization.facade';
import { OrganizationStore } from '../../../services/organization/organization.store';
import { UserFacade } from '../../../services/user/user.facade';
import { UserStore } from '../../../services/user/user.store';
import { ViewController } from '../../../services/view/view.controller';
import { ViewStore } from '../../../services/view/view.store';

import { AddOrganizationModal } from '../add-organization-modal/add-organization-modal';
import { ReservationType } from '../../../model/reservationType';
import { initialPage } from '../../../model/page';

@Component({
  selector: 'app-calendar-booking-modal',
  imports: [CommonModule, FormsModule, TranslocoPipe, AddOrganizationModal],
  templateUrl: './calendar-booking-modal.html',
  styleUrl: './calendar-booking-modal.css',
})
export class CalendarBookingModal {
  readonly helper = inject(CalendarHelper);

  readonly store = inject(ReservationStore);
  readonly userStore = inject(UserStore);
  readonly organizationStore = inject(OrganizationStore);

  readonly facade = inject(ReservationFacade);
  readonly organizationFacade = inject(OrganizationFacade);
  readonly userFacade = inject(UserFacade);

  readonly authService = inject(AuthService);

  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);

  readonly isAdmin = this.authService.isAdmin();

  constructor() {
    // Keep the booking organization list synchronized with the selected
    // user's memberships. Do not track the booking itself here, because
    // changing its organization must not override the private checkbox.
    effect(() => {
      const organizations = this.organizationStore.organizations();

      untracked(() => {
        const booking = this.store.selectedBooking();

        if (!booking) return;

        if (organizations.length === 0) {
          this.store.isPrivateReservationCheckboxActivated.set(true);
          return;
        }

        this.store.isPrivateReservationCheckboxActivated.set(false);

        const selectedOrganizationExists = organizations.some(
          (org) => org.id === booking.organizationId,
        );

        // Select the first organization if the current one does not
        // belong to the selected user.
        if (!selectedOrganizationExists) {
          this.store.selectedBooking.update((current) =>
            current ? { ...current, organizationId: organizations[0].id } : null,
          );
        }
      });
    });

    if (this.store.reservationTypeOptions().length > 0) {
      this.store.selectedReservationType.set(this.store.reservationTypeOptions()[0]);
    }

    this.initializeBooking();

    if (isDevMode()) {
      console.log('CalendarBookingModal initialized', {
        isAdmin: this.isAdmin,
        booking: this.store.selectedBooking(),
      });
    }
  }

  /**
   * Initialize the modal using the user already assigned to the booking.
   *
   * Admins can subsequently change that user.
   * Non-admins always operate on their own user ID.
   */
  private initializeBooking(): void {
    const booking = this.store.selectedBooking();

    if (!booking) return;

    const userId = this.isAdmin ? booking.reservedByUserId : this.authService.currentUser()?.id;

    if (!userId) return;

    // Remove organizations from the previously selected user.
    this.resetOrganizations();

    if (this.isAdmin) {
      this.userFacade.getAllUsers();
    }

    this.loadOrganizationsForUser(userId);
  }

  /**
   * Admin-only: change the person on whose behalf the reservation
   * will be created.
   */
  onUserIdSelected(userId: number | string): void {
    if (!this.isAdmin) return;

    const id = Number(userId);

    if (!Number.isInteger(id) || id <= 0) return;

    const userExists = this.userStore.users().some((user) => user.id === id);

    if (!userExists) return;

    // Update booking ownership, not the globally selected application user.
    this.store.selectedBooking.update((booking) =>
      booking
        ? {
            ...booking,
            reservedByUserId: id,
            organizationId: null,
          }
        : null,
    );

    this.resetOrganizations();

    // Fetch only organizations belonging to the newly selected user.
    this.loadOrganizationsForUser(id);
  }

  private resetOrganizations(): void {
    this.organizationStore.organizationsPage.set({
      ...initialPage,
      content: [],
    });

    this.organizationStore.selectedOrganization.set(null);

    // Until the new user's organizations arrive, prevent selecting
    // an organization belonging to the previous user.
    this.store.isPrivateReservationCheckboxActivated.set(true);
  }

  private loadOrganizationsForUser(userId: number): void {
    this.organizationFacade.getAllOrganizationsForUserNotPagination(false, userId);
  }

  handleAddOrganizationModal(): void {
    this.viewStore.isAddOrganizationModalActive.set(true);
  }

  togglePrivateReservationCheckbox(): void {
    if (this.isPrivateReservationForced()) return;

    const isPrivate = this.store.isPrivateReservationCheckboxActivated();

    this.store.isPrivateReservationCheckboxActivated.set(!isPrivate);

    const booking = this.store.selectedBooking();
    const organizations = this.organizationStore.organizations();

    // When switching back to an organization reservation,
    // restore the first available organization if necessary.
    if (isPrivate && booking && !organizations.some((org) => org.id === booking.organizationId)) {
      this.store.selectedBooking.update((current) =>
        current ? { ...current, organizationId: organizations[0].id } : null,
      );
    }
  }

  isPrivateReservationForced(): boolean {
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
