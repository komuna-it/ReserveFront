import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './organization-list.html',
  styleUrl: './organization-list.css',
})
export class OrganizationList implements OnInit, OnDestroy {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);

  readonly safeOrganizations = computed(() => {
    const orgs = this.store.allOrganizations();
    if (!Array.isArray(orgs)) return [];

    return orgs.map((org) => ({
      ...org,
      owners: Array.isArray(org?.owners) ? org.owners : [],
      members: Array.isArray(org?.members) ? org.members : [],
    }));
  });

  ngOnInit(): void {
    this.facade.getAllMembersAllOrganizations(0);
    this.store.isAdminOrganizationActive.set(true);
  }

  ngOnDestroy(): void {
    this.store.teamsList.set([]);
    this.store.isAdminOrganizationActive.set(false);
  }

  closeModals(): void {
    this.store.isAdminAddOrganizationActive.set(false);
    this.store.isAdminAddOrganizationSuccess.set(false);
  }

  createOrganization(name: string): void {
    if (!name || name.trim() === '') return;

    try {
      this.facade.createOrganization(name.trim());
      this.store.isAdminAddOrganizationSuccess.set(true);
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  }
}
