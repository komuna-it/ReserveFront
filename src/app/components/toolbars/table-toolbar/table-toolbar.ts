import { Component, computed, inject, input, effect } from '@angular/core';
import { ReservationStore } from '../../reservation/reservation.store';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { ToolbarType } from '../toolbarType';
import { SearchBar } from '../search-bar/search-bar';
import { ReservationStatus } from '../../../model/reservationStatus';
import { TranslocoPipe } from '@jsverse/transloco';

interface Identifiable {
  id: number;
}

@Component({
  selector: 'app-table-toolbar',
  imports: [SearchBar, TranslocoPipe],
  templateUrl: './table-toolbar.html',
  styleUrl: './table-toolbar.css',
})
export class TableToolbar {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly type = input<ToolbarType | null>();

  readonly ToolbarType = ToolbarType;
  readonly ReservationStatus = ReservationStatus;

  readonly selectedIds = this.store.toolbarSelectedIds;

  readonly activeItems = computed<Identifiable[]>(() => {
    switch (this.type()) {
      case ToolbarType.RESERVATION_BY_STATUS:
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
      this.type() === ToolbarType.RESERVATION_BY_STATUS &&
      (this.store.statusForAdminPage() === ReservationStatus.CREATED ||
        this.store.statusForAdminPage() === ReservationStatus.CONFIRMED ||
        this.store.statusForAdminPage() === ReservationStatus.REQUESTED_CANCELLATION)
    );
  }

  showAcceptButton() {
    return (
      this.type() === ToolbarType.RESERVATION_BY_STATUS &&
      (this.store.statusForAdminPage() === ReservationStatus.CREATED ||
        this.store.statusForAdminPage() === ReservationStatus.REQUESTED_CANCELLATION)
    );
  }

  showPaidButton() {
    return this.type() === ToolbarType.RESERVATION_BY_STATUS;
  }

  showUnpaidButton() {
    return this.type() === ToolbarType.RESERVATION_BY_STATUS;
  }

  handlePaid(paid: boolean) {
    const selectedRes = this.store.toolbarSelectedIds();
    this.facade.isReservationPaid(selectedRes, paid);
  }
}
