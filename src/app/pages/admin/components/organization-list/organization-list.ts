import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Organization } from '../../../../model/organization';
import { Pagination } from '../../../../layout/pagination/pagination';
import { ToolbarType } from '../../../../components/toolbars/toolbarType';
import { AuthService } from '../../../../auth/authService';
import { TableToolbar } from '../../../../components/toolbars/table-toolbar/table-toolbar';

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, Pagination, TableToolbar],
  templateUrl: './organization-list.html',
  styleUrl: './organization-list.css',
})
export class OrganizationList implements OnInit, OnDestroy {
  readonly mode = input<'admin' | 'user'>('user');
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly auth = inject(AuthService);
  readonly toolbarType = ToolbarType.ADMIN_ORGANIZATIONS;

  readonly safeOrganizations = computed(() => {
    const orgs = this.store.organizations();
    if (!Array.isArray(orgs)) return [];

    return orgs.map((org) => ({
      ...org,
      owners: Array.isArray(org?.owners) ? org.owners : [],
      members: Array.isArray(org?.members) ? org.members : [],
    }));
  });

  readonly areAllSelected = computed(() => {
    const items = this.store.organizations();
    if (items.length === 0) return false;
    const selected = this.store.toolbarSelectedIds();
    return items.every((res) => selected.has(res.id));
  });

  readonly isIndeterminate = computed(() => {
    const selectedSize = this.store.toolbarSelectedIds().size;
    return selectedSize > 0 && !this.areAllSelected();
  });

  readonly isReservationsExpanded = signal(true);
  readonly isOwnersExpanded = signal(true);
  readonly isMembersExpanded = signal(true);

  constructor() {
    const orgs = this.store.organizations();

    if (this.auth.isAdmin()) {
      this.facade.getOrganizations(true, null);
    } else {
      const user = this.auth.currentUser();
      if (user) this.facade.getOrganizations(true, user.id);
    }
    effect(() => {
      this.store.currentSortBy();
      this.store.currentSortDir();
      this.store.currentOrganizationsPage();
      this.store.currentOrganizationsSize();
    });
    if (this.auth.isAdmin()) {
      this.store.toolbarType.set(ToolbarType.ADMIN_ORGANIZATIONS);
      this.facade.getOrganizations(true, null);
    }
    // else {
    //   if (user) this.facade.getOrganizations(true, user.id);
    // }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.mode() === 'admin') {
      this.store.teamsList.set([]);
      this.store.isAdminOrganizationModalActive.set(false);
    }
  }

  toggleMasterCheckbox(): void {
    if (this.areAllSelected() || this.isIndeterminate()) {
      this.store.clearSelection();
    } else {
      const allIds = new Set(this.store.organizations().map((res) => res.id));
      this.store.setSelectedIds(allIds);
    }
  }

  toggleSelection(id: number): void {
    this.store.toggleSelection(id);
  }

  selectOrganizationAndOpenDetailsModal(org: Organization): void {
    this.store.selectedOrganization.set(org);

    this.store.isOrganizationDetailsModalActive.set(true);
  }
}
