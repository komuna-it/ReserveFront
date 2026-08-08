import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { Pagination } from '../../../../layout/pagination/pagination';
import { ErrorPopup } from '../../../../modals/error-popup/error-popup';
import { TableToolbar } from '../../../../components/toolbars/table-toolbar/table-toolbar';
import { ToolbarType } from '../../../../components/toolbars/toolbarType';
import { UserDetailsModal } from '../../../../modals/user-details-modal/user-details-modal';
import { User } from '../../../../model/user';

@Component({
  selector: 'app-users-table',
  imports: [TableToolbar, CommonModule, TranslocoPipe, Pagination, ErrorPopup],
  templateUrl: './users-table.html',
  styleUrl: './users-table.css',
})
export class UsersTable {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);

  readonly toolbarType = ToolbarType.USERS;

  constructor() {
    this.store.toolbarType.set(ToolbarType.USERS);
    effect(() => {
      this.store.currentSortBy();
      this.store.currentSortDir();
      this.store.paginationPage();
      this.store.paginationSize();

      this.facade.getAllUsers();
    });
  }

  readonly areAllSelected = computed(() => {
    const users = this.store.allUsers();
    if (users.length === 0) return false;
    const selected = this.store.toolbarSelectedIds();
    return users.every((u) => selected.has(u.id));
  });

  readonly isIndeterminate = computed(() => {
    const selectedSize = this.store.toolbarSelectedIds().size;
    return selectedSize > 0 && !this.areAllSelected();
  });

  toggleMasterCheckbox(): void {
    if (this.areAllSelected() || this.isIndeterminate()) {
      this.store.clearSelection();
    } else {
      const allIds = new Set(this.store.allUsers().map((u) => u.id));
      this.store.setSelectedIds(allIds);
    }
  }

  toggleUserSelection(id: number): void {
    this.store.toggleSelection(id);
  }

  selectUserAndOpenDetailsModal(user: User) {
    this.store.selectedUser.set(user);
    this.store.isUserDetailsModalActive.set(true);
  }
}
