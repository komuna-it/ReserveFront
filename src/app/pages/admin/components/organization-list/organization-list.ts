import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AddUserIntoOrganizationModal } from '../../../../components/modals/add-user-into-organization-modal/add-user-into-organization-modal';
import { User } from '../../../../model/user';
import { Organization } from '../../../../model/organization';
import { AddOrganizationModal } from '../../../../components/modals/add-organization-modal/add-organization-modal';
import { OrganizationMemberDto } from '../../../../model/organizationMemberDto';

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, AddUserIntoOrganizationModal, AddOrganizationModal],
  templateUrl: './organization-list.html',
  styleUrl: './organization-list.css',
})
export class OrganizationList implements OnInit, OnDestroy {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly loco = inject(TranslocoService);
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
    this.facade.getAllUsers();
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

    this.store.modalDeleteOwnerActive.set(false);
    this.store.modalDeleteMemberActive.set(false);
    this.store.modalDeleteOrganizationActive.set(false);

    this.store.modalDeleteOrganizationSuccess.set(false);
    this.store.modalDeleteMemberSuccess.set(false);
    this.store.modalDeleteOwnerSuccess.set(false);

    this.store.globalErrorKey.set(null);
  }

  handleDeleteOrganization(orgId: number): void {
    console.log('handleDeleteOrganization called with orgId:', orgId);
    if (!orgId) return;

    const org = this.store.allOrganizations().find((o) => o.id === orgId);
    if (!org) {
      console.error(`Organization with ID ${orgId} not found in allOrganizations.`);
      return;
    }
    this.store.organizationListSelectedOrganization.set(org);
    this.store.modalDeleteOrganizationActive.set(true);
    console.log(
      'Selected organization ID set to:',
      this.store.organizationListSelectedOrganization(),
    );
    console.log('Modal delete organization active:', this.store.modalDeleteOrganizationActive());
    console.log('Current state of store:', {
      organizationListSelectedOrganizationId: this.store.organizationListSelectedOrganization(),
      modalDeleteOrganizationActive: this.store.modalDeleteOrganizationActive(),
    });
  }

  handleDeleteMember(userId: number, orgId: number): void {
    if (!userId || !orgId) return;
    const user = this.store.allUsers().find((u) => u.id === userId);
    if (!user) {
      console.error(`User with ID ${userId} not found in allUsers.`);
      return;
    }
    const org = this.store.allOrganizations().find((o) => o.id === orgId);
    if (!org) {
      console.error(`Organization with ID ${orgId} not found in allOrganizations.`);
      return;
    }
    this.store.organizationListSelectedUser.set(user);
    this.store.organizationListSelectedOrganization.set(org);
    this.store.modalDeleteMemberActive.set(true);
  }

  handleDeleteOwner(ownerId: number, orgId: number): void {
    if (!ownerId || !orgId) return;
    const user = this.store.allUsers().find((u) => u.id === ownerId);
    if (!user) {
      console.error(`User with ID ${ownerId} not found in allUsers.`);
      return;
    }
    const org = this.store.allOrganizations().find((o) => o.id === orgId);
    if (!org) {
      console.error(`Organization with ID ${orgId} not found in allOrganizations.`);
      return;
    }
    this.store.organizationListSelectedUser.set(user);
    this.store.organizationListSelectedOrganization.set(org);
    this.store.modalDeleteOwnerActive.set(true);
  }

  confirmDeleteOrganization(): void {
    const org = this.store.organizationListSelectedOrganization();
    if (org) {
      this.facade.removeOrg(org.id);
      this.store.modalDeleteOrganizationActive.set(false);
      this.store.organizationListSelectedOrganization.set(null);
      this.store.modalDeleteOrganizationSuccess.set(true);
    }
  }

  confirmDeleteMember(): void {
    const user = this.store.organizationListSelectedUser();
    const org = this.store.organizationListSelectedOrganization();
    if (user && org) {
      this.facade.removeUserFromOrganization(user.id, org.id);
      this.store.modalDeleteMemberActive.set(false);
      this.store.organizationListSelectedUser.set(null);
      this.store.organizationListSelectedOrganization.set(null);
      this.store.modalDeleteMemberSuccess.set(true);
    }
  }

  confirmDeleteOwner(): void {
    const user = this.store.organizationListSelectedUser();
    const org = this.store.organizationListSelectedOrganization();
    if (!user || !org) {
      return;
    }
    const ownerId = user.id ?? 0;
    const orgId = org.id ?? 0;

    if (ownerId && orgId) {
      this.facade.removeOwnerFromOrganization(ownerId, orgId);
      this.store.modalDeleteOwnerActive.set(false);
      this.store.organizationListSelectedUser.set(null);
      this.store.organizationListSelectedOrganization.set(null);
      this.store.modalDeleteOwnerSuccess.set(true);
    }
  }

  handleAddMember(orgId: number): void {
    if (!orgId) return;
    const org = this.store.allOrganizations().find((o) => o.id === orgId);
    if (!org) {
      console.error(`Organization with ID ${orgId} not found in allOrganizations.`);
      return;
    }
    this.store.organizationListSelectedOrganization.set(org);
    this.store.modalAddMemberActive.set(true);
  }

  orgTrustedText(org: Organization) {
    return org.trusted
      ? this.loco.translate('ORGANIZATION_LIST.TRUSTED')
      : this.loco.translate('ORGANIZATION_LIST.NOT_TRUSTED');
  }

  orgTrustedButtonText(org: Organization) {
    return org.trusted
      ? this.loco.translate('ORGANIZATION_LIST.MARK_AS_NOT_TRUSTED')
      : this.loco.translate('ORGANIZATION_LIST.MARK_AS_TRUSTED');
  }

  userTrustedButtonText(user: OrganizationMemberDto) {
    return user.trusted
      ? this.loco.translate('ORGANIZATION_LIST.MARK_AS_NOT_TRUSTED')
      : this.loco.translate('ORGANIZATION_LIST.MARK_AS_TRUSTED');
  }

  userTrustedText(user: OrganizationMemberDto) {
    return user.trusted
      ? this.loco.translate('ORGANIZATION_LIST.NOT_TRUSTED')
      : this.loco.translate('ORGANIZATION_LIST.TRUSTED');
  }
}
