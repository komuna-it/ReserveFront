import { Component, computed, effect, inject, isDevMode } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CalendarHelper } from '../../calendar/calendar.helper';
import { AuthService } from '../../../auth/authService';
import { ReservationFacade } from '../../../services/reservation/reservation.facade';
import { ReservationStore } from '../../../services/reservation/reservation.store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddOrganizationModal } from '../add-organization-modal/add-organization-modal';
import { ReservationType } from '../../../model/reservationType';
import { User } from '../../../model/user';
import { OrganizationFacade } from '../../../services/organization/organization.facade';
import { UserFacade } from '../../../services/user/user.facade';
import { UserStore } from '../../../services/user/user.store';
import { ViewController } from '../../../services/view/view.controller';
import { ViewStore } from '../../../services/view/view.store';
import { OrganizationStore } from '../../../services/organization/organization.store';
import { Organization } from '../../../model/organization';
import { initialPage, Page } from '../../../model/page';

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
    this.clearBooking();
    this.getMyOrgs();
    effect(() => {
      if (this.authService.isAdmin()) {
        this.userFacade.getAllUsers();
      }

      const organizations = this.organizationStore.organizations();
      const booking = this.store.selectedBooking();

      if (!booking) return;

      if (organizations.length === 0) {
        this.store.isPrivateReservationCheckboxActivated.set(true);
        return;
      }

      const matchingOrganization = organizations.find((org) => org.id === booking.organizationId);

      if (!matchingOrganization) {
        this.store.selectedBooking.update((current) =>
          current ? { ...current, organizationId: organizations[0].id } : null,
        );
      }

      this.store.isPrivateReservationCheckboxActivated.set(false);
    });
    if (isDevMode()) {
      console.log('CalendarBookingModal initialized');
      console.log('Current user:', this.authService.currentUser());
      console.log('Selected booking:', this.booking);
    }
  }

  clearBooking(): void {
    if (this.booking) {
      this.booking.organizationId = null;
    }
  }

  onUserIdSelected(userId: number): void {
    const id = Number(userId);
    const user = this.userStore.users().find((u) => u.id === id);

    if (!user) return;

    this.userStore.selectedUser.set(user);

    if (this.booking) {
      this.booking.organizationId = null;
      this.booking.reservedByUserId = user.id;
    }

    this.organizationStore.organizationsPage.set(initialPage);

    this.organizationFacade.getOrganizations(false, user.id);
  }

  isAdminOrManagerSelected = computed(() => {
    const adminAndManagersUserIds = new Set<number>();

    this.userStore
      .users()
      .filter((u) => u.role === 'ADMIN' || u.role === 'MANAGER')
      .forEach((u) => adminAndManagersUserIds.add(u.id));

    const user = this.userStore.selectedUser();

    return user ? adminAndManagersUserIds.has(user.id) : false;
  });

  handleAddOrganizationModal(): void {
    this.viewStore.isAddOrganizationModalActive.set(true);
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

  getMyOrgs(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;
    this.organizationFacade.getOrganizations(true, currentUser.id);
  }
}
