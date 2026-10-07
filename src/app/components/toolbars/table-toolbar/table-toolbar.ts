import { Component, computed, inject, input, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReservationStore } from '../../reservation/reservation.store';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { ToolbarType } from '../toolbarType';
import { ReservationStatus } from '../../../model/reservationStatus';
import { TranslocoPipe } from '@jsverse/transloco';

interface Identifiable {
  id: number;
}

@Component({
  selector: 'app-table-toolbar',
  imports: [TranslocoPipe],
  templateUrl: './table-toolbar.html',
})
export class TableToolbar {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
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

  showCancelButton() {
    return (
      this.type() === ToolbarType.RESERVATIONS &&
      (this.store.statusForAdminPage() === ReservationStatus.CREATED ||
        this.store.statusForAdminPage() === ReservationStatus.CONFIRMED ||
        this.store.statusForAdminPage() === ReservationStatus.REQUESTED_CANCELLATION)
    );
  }

  showAcceptButton() {
    return (
      this.type() === ToolbarType.RESERVATIONS &&
      (this.store.statusForAdminPage() === ReservationStatus.CREATED ||
        this.store.statusForAdminPage() === ReservationStatus.REQUESTED_CANCELLATION)
    );
  }

  showPaidButton() {
    return this.type() === ToolbarType.RESERVATIONS;
  }

  showUnpaidButton() {
    return this.type() === ToolbarType.RESERVATIONS;
  }

  handlePaid(paid: boolean) {
    const selectedRes = this.store.toolbarSelectedIds();
    this.facade.isReservationPaid(selectedRes, paid);
  }

  toggleOnlyFuture(): void {
    const nextFutureState = !this.store.toolbarOnlyFuture();
    this.store.toolbarOnlyFuture.set(nextFutureState);
    const pageKey = this.store.reservationsPageQueryParamName();
    console.log('TableToolbar toggleOnlyFuture nextFutureState:', nextFutureState);
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
