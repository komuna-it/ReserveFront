import { Component, computed, inject, input, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReservationStore } from '../../../services/reservation/reservation.store';
import { ReservationFacade } from '../../../services/reservation/reservation.facade';
import { ToolbarType } from '../toolbarType';
import { ReservationStatus } from '../../../model/reservationStatus';
import { TranslocoPipe } from '@jsverse/transloco';
import { OrganizationFacade } from '../../../services/organization/organization.facade';
import { UserFacade } from '../../../services/user/user.facade';

interface Identifiable {
  id: number;
}

@Component({
  selector: 'app-table-toolbar',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './table-toolbar.html',
})
export class TableToolbar {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly organizationFacade = inject(OrganizationFacade);
  readonly userFacade = inject(UserFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly type = input<ToolbarType | null>();
  readonly ToolbarType = ToolbarType;
  readonly ReservationStatus = ReservationStatus;
  readonly selectedIds = this.store.toolbarSelectedIds;

  readonly activeItems = computed<Identifiable[]>(() => {
    switch (this.type()) {
      case ToolbarType.RESERVATIONS:
        return this.store.reservations();
      case ToolbarType.USERS:
        return this.store.allUsers();
      case ToolbarType.ADMIN_ORGANIZATIONS:
        return this.store.allOrganizations();
      default:
        return [];
    }
  });

  readonly areAllSelected = computed(() => {
    const items = this.activeItems();
    if (items.length === 0) return false;
    const selected = this.selectedIds();
    return items.every((item) => selected.has(item.id));
  });

  readonly isNoneSelected = computed(() => this.selectedIds().size === 0);

  readonly isIndeterminate = computed(() => {
    return !this.isNoneSelected() && !this.areAllSelected();
  });

  constructor() {
    effect(() => {
      this.type();
      this.store.clearSelection();
    });
  }

  toggleSelectAll(): void {
    if (this.areAllSelected()) {
      this.store.clearSelection();
    } else {
      const allIds = new Set(this.activeItems().map((item) => item.id));
      this.store.setSelectedIds(allIds);
    }
  }

  showCancelButton(): boolean {
    const status = this.store.statusForAdminPage();
    return (
      this.type() === ToolbarType.RESERVATIONS &&
      (status === ReservationStatus.CREATED ||
        status === ReservationStatus.CONFIRMED ||
        status === ReservationStatus.REQUESTED_CANCELLATION ||
        status === ReservationStatus.REJECTED_CANCELLATION)
    );
  }

  showAcceptButton(): boolean {
    const status = this.store.statusForAdminPage();
    return (
      this.type() === ToolbarType.RESERVATIONS &&
      (status === ReservationStatus.CREATED || status === ReservationStatus.REQUESTED_CANCELLATION)
    );
  }

  showPaidButton(): boolean {
    return this.type() === ToolbarType.RESERVATIONS;
  }

  showUnpaidButton(): boolean {
    return this.type() === ToolbarType.RESERVATIONS;
  }

  handleAccept(): void {
    const status = this.store.statusForAdminPage();
    if (status === ReservationStatus.REQUESTED_CANCELLATION) {
      this.facade.updateReservationsStatus(ReservationStatus.CANCELLED);
    } else {
      this.facade.updateReservationsStatus(ReservationStatus.CONFIRMED);
    }
  }

  handleCancelOrReject(): void {
    const status = this.store.statusForAdminPage();
    if (status === ReservationStatus.REQUESTED_CANCELLATION) {
      this.facade.updateReservationsStatus(ReservationStatus.REJECTED_CANCELLATION);
      return;
    }

    const selectedIds = this.selectedIds();
    const selectedReservations = this.store.reservations().filter((r) => selectedIds.has(r.id));
    const hasRejectedCancellation = selectedReservations.some(
      (r) => r.status === ReservationStatus.REJECTED_CANCELLATION,
    );

    console.log('hasRejectedCancellation', hasRejectedCancellation);
    console.log('status', status);
    console.log('selectedReservations', selectedReservations);
    if (
      hasRejectedCancellation ||
      status === ReservationStatus.CREATED ||
      status === ReservationStatus.CONFIRMED ||
      status === ReservationStatus.REJECTED_CANCELLATION
    ) {
      this.facade.updateReservationsStatus(ReservationStatus.REJECTED);
    } else {
      this.facade.updateReservationsStatus(ReservationStatus.CANCELLED);
    }
  }

  handlePaid(paid: boolean): void {
    const selectedRes = this.store.toolbarSelectedIds();
    this.facade.isReservationPaid(selectedRes, paid);
  }

  toggleOnlyFuture(): void {
    const nextFutureState = !this.store.toolbarOnlyFuture();
    this.store.toolbarOnlyFuture.set(nextFutureState);
    const pageKey = this.store.reservationsPageQueryParamName();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        future: nextFutureState ? 'true' : 'false',
        [pageKey]: 0,
      },
      queryParamsHandling: 'merge',
    });
  }
}
