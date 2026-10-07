import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFacade } from '../../../../services/user/user.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { Pagination } from '../../../../layout/pagination/pagination';
import { TableToolbar } from '../../../../components/toolbars/table-toolbar/table-toolbar';
import { ToolbarType } from '../../../../components/toolbars/toolbarType';
import { User } from '../../../../model/user';
import { ActivatedRoute, Router } from '@angular/router';
import { UserStore } from '../../../../services/user/user.store';
import { ViewController } from '../../../../services/view/view.controller';
import { ViewStore } from '../../../../services/view/view.store';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [TableToolbar, CommonModule, TranslocoPipe, Pagination],
  templateUrl: './users-table.html',
})
export class UsersTable {
  readonly userStore = inject(UserStore);
  readonly facade = inject(UserFacade);

  readonly toolbarType = ToolbarType.USERS;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);

  toggleSort(column: string): void {
    const currentSort = this.userStore.currentSortBy();
    const currentDir = this.userStore.currentSortDir();
    const nextDir = currentSort === column && currentDir === 'asc' ? 'desc' : 'asc';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sortBy: column, sortDir: nextDir, page: 0 },
      queryParamsHandling: 'merge',
    });
  }

  constructor() {
    effect(() => {
      this.userStore.currentSortBy();
      this.userStore.currentSortDir();
      this.userStore.currentUsersPage();
      this.userStore.currentUsersSize();

      this.facade.getAllUsers();
    });
  }

  readonly areAllSelected = computed(() => {
    const users = this.userStore.users();
    if (users.length === 0) return false;
    const selected = this.userStore.toolbarSelectedIds();
    return users.every((u) => selected.has(u.id));
  });

  readonly isIndeterminate = computed(() => {
    const selectedSize = this.userStore.toolbarSelectedIds().size;
    return selectedSize > 0 && !this.areAllSelected();
  });

  toggleMasterCheckbox(): void {
    if (this.areAllSelected()) {
      this.userStore.clearSelection();
    } else {
      const allIds = new Set(this.userStore.users().map((u) => u.id));
      this.userStore.setSelectedIds(allIds);
    }
  }

  toggleUserSelection(id: number): void {
    this.userStore.toggleSelection(id);
  }

  selectUserAndOpenDetailsModal(user: User) {
    this.userStore.selectedUser.set(user);
    this.viewStore.isUserDetailsModalActive.set(true);
  }
}
