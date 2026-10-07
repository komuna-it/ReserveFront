import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  computed,
  effect,
  input,
  signal,
  isDevMode,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationStore } from '../../../../services/organization/organization.store';
import { OrganizationFacade } from '../../../../services/organization/organization.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { Organization } from '../../../../model/organization';
import { Pagination } from '../../../../layout/pagination/pagination';
import { ToolbarType } from '../../../../components/toolbars/toolbarType';
import { AuthService } from '../../../../auth/authService';
import { TableToolbar } from '../../../../components/toolbars/table-toolbar/table-toolbar';
import { ViewController } from '../../../../services/view/view.controller';
import { ViewStore } from '../../../../services/view/view.store';

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, Pagination, TableToolbar],
  templateUrl: './organization-list.html',
  styleUrl: './organization-list.css',
})
export class OrganizationList implements OnInit, OnDestroy {
  readonly organizationListMode = input<'admin' | 'user'>('user');
  readonly store = inject(OrganizationStore);
  readonly facade = inject(OrganizationFacade);
  readonly organizationFacade = inject(OrganizationFacade);
  readonly auth = inject(AuthService);
  readonly toolbarType = ToolbarType.ADMIN_ORGANIZATIONS;
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);

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
    const all = items.every((res) => selected.has(res.id));
    if (isDevMode()) {
      console.log('areAllSelected', all, selected, items);
    }
    return all;
  });

  readonly isIndeterminate = computed(() => {
    const selectedSize = this.store.toolbarSelectedIds().size;
    return selectedSize > 0 && !this.areAllSelected();
  });

  readonly isReservationsExpanded = signal(true);
  readonly isOwnersExpanded = signal(true);
  readonly isMembersExpanded = signal(true);

  constructor() {
    effect(() => {
      this.store.currentOrganizationsPage();
      this.store.currentOrganizationsSize();
    });
  }

  ngOnInit(): void {
    if (this.organizationListMode() === 'admin') {
      this.organizationFacade.getOrganizations(true, null);
    } else {
      const user = this.auth.currentUser();
      if (user) this.organizationFacade.getOrganizations(true, user.id);
    }
  }

  ngOnDestroy(): void {
    if (this.organizationListMode() === 'admin') {
      this.store.teamsList.set([]);
      this.viewStore.isAdminOrganizationModalActive.set(false);
    }
  }

  toggleMasterCheckbox(): void {
    if (this.areAllSelected()) {
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
    this.viewStore.isOrganizationDetailsModalActive.set(true);
  }
}
