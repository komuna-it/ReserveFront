import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../auth/authService';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizationMemberDto } from '../../model/organizationMemberDto';
import { SettingsFacade } from '../../settings/settingsFacade';
import { SettingsStore } from '../../settings/settingsStore';
import { environment } from '../../../environments/environment';
import { TextFormatingTool } from '../../tools/textFormatingTool';
import { OrganizationStore } from './organization.store';
import { OrganizationApi } from './organization.api';
import { UserStore } from '../user/user.store';
import { ViewStore } from '../view/view.store';
import { ViewController } from '../view/view.controller';

@Injectable({ providedIn: 'root' })
export class OrganizationFacade {
  private api = inject(OrganizationApi);
  private organizationStore = inject(OrganizationStore);
  private userStore = inject(UserStore);
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);

  public settingsFacade = inject(SettingsFacade);
  public settingsStore = inject(SettingsStore);
  private readonly route = inject(ActivatedRoute);
  private apiUrl = environment.apiUrl;
  readonly textFormatingTool = inject(TextFormatingTool);

  constructor() {
    this.settingsFacade.getSettings(null, true);
  }

  refreshOrganizations() {
    if (this.authService.isAdmin()) {
      this.getOrganizations(true, null);
    } else if (this.authService.currentUser()) {
      this.getOrganizations(true, this.authService.currentUser()?.id ?? 0);
    }
  }

  changeOrganizationsPage(newPage: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [this.organizationStore.organizationsPageQueryParamName()]: newPage },
      queryParamsHandling: 'merge',
    });
  }

  changeOrganizationsSize(newSize: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [this.organizationStore.organizationsSizeQueryParamName()]: newSize,
        [this.organizationStore.organizationsPageQueryParamName()]: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  createOrganization(name: string) {
    this.api.createOrganization(name).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => console.error(`Failed to create organization ${name}`, e),
    });
  }

  removeOwnerFromOrganization(ownerId: number, organizationId: number): void {
    this.api.removeOwnerFromOrganization(ownerId, organizationId).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => {
        this.viewController.showError('ACTION_FAILED' as any);
        console.error(e);
      },
    });
  }

  removeOrg(organizationId: number): void {
    this.api.removeOrg(organizationId).subscribe({
      next: () => this.refreshOrganizations(),
      error: (e) => {
        console.error(`Failed to delete organization`, e);
        this.viewController.showError('ACTION_FAILED' as any);
      },
    });
  }

  addMemberToOrganization(userId: number, orgId: number): void {
    this.api.addMemberIntoOrganization(userId, orgId).subscribe({
      next: () => {
        this.viewStore.isModalAddMemberActive.set(false);
        this.organizationStore.organizationListSelectedUser.set(null);
        this.viewController.showSuccess('SUCCESS' as any);

        const addedUser = this.userStore.users().find((u) => u.id === userId);
        if (addedUser) {
          const newMember: OrganizationMemberDto = {
            id: 0,
            organizationId: orgId,
            userId: addedUser.id,
            role: 'MEMBER',
            email: addedUser.email,
            nick: addedUser.nick,
          };
          this.organizationStore.selectedOrganization.update((currentOrg) => {
            if (!currentOrg || currentOrg.id !== orgId) return currentOrg;
            return {
              ...currentOrg,
              members: [...(currentOrg.members || []), newMember],
            };
          });
        }
        this.refreshOrganizations();
      },
      error: (err) => {
        console.error('Error adding member to organization:', err);
        this.viewController.showError('ACTION_FAILED' as any);
      },
    });
  }

  addOwnerToOrganization(userId: number, orgId: number): void {
    this.api.addOwnerIntoOrganization(userId, orgId).subscribe({
      next: () => {
        this.viewStore.isModalAddOwnerActive.set(false);
        this.organizationStore.organizationListSelectedUser.set(null);
        this.viewController.showSuccess('SUCCESS' as any);

        const addedUser = this.userStore.users().find((u) => u.id === userId);
        if (addedUser) {
          const newOwner: OrganizationMemberDto = {
            id: 0,
            organizationId: orgId,
            userId: addedUser.id,
            role: 'OWNER',
            email: addedUser.email,
            nick: addedUser.nick,
          };
          this.organizationStore.selectedOrganization.update((currentOrg) => {
            if (!currentOrg || currentOrg.id !== orgId) return currentOrg;
            return {
              ...currentOrg,
              owners: [...(currentOrg.owners || []), newOwner],
            };
          });
        }
        this.refreshOrganizations();
      },
      error: (err) => {
        console.error('Error adding owner to organization:', err);
        this.viewController.showError('ACTION_FAILED' as any);
      },
    });
  }

  markSingleOrganizationAsTrusted(organizationId: number): void {
    this.api.markOrganizationsAsTrusted([organizationId]).subscribe({
      next: () => {
        const currentOrg = this.organizationStore.selectedOrganization();
        if (currentOrg && currentOrg.id === organizationId) {
          this.organizationStore.selectedOrganization.set({ ...currentOrg, trusted: true });
        }
        this.refreshOrganizations();
      },
      error: (e) => console.error(`Failed to markOrganizationsAsTrusted`, e),
    });
  }

  markSingleOrganizationAsUntrusted(organizationId: number): void {
    this.api.markOrganizationsAsUntrusted([organizationId]).subscribe({
      next: () => {
        const currentOrg = this.organizationStore.selectedOrganization();
        if (currentOrg && currentOrg.id === organizationId) {
          this.organizationStore.selectedOrganization.set({ ...currentOrg, trusted: false });
        }
        this.refreshOrganizations();
      },
      error: (e) => console.error(`Failed to markOrganizationsAsUntrusted`, e),
    });
  }

  markOrganizationsAsTrusted(): void {
    const ids = Array.from(this.organizationStore.toolbarSelectedIds());
    this.api.markOrganizationsAsTrusted(ids).subscribe({
      next: () => {
        this.refreshOrganizations();
        this.organizationStore.clearSelection();
      },
    });
  }

  markOrganizationsAsUntrusted(): void {
    const ids = Array.from(this.organizationStore.toolbarSelectedIds());
    this.api.markOrganizationsAsUntrusted(ids).subscribe({
      next: () => {
        this.refreshOrganizations();
        this.organizationStore.clearSelection();
      },
    });
  }

  preparePromoteMember(userId: number, orgId: number): void {
    this.api.promoteMemberToOwner(userId, orgId).subscribe({
      next: (updatedMember) => {
        const org = this.organizationStore.selectedOrganization();
        if (!org || org.id !== orgId) return;

        const memberToPromote = org.members?.find((m) => m.userId === userId);
        const promotedUser = updatedMember?.id
          ? updatedMember
          : { ...memberToPromote!, role: 'OWNER' };

        this.organizationStore.selectedOrganization.set({
          ...org,
          owners: [...org.owners.filter((o) => o.userId !== userId), promotedUser],
          members: org.members.filter((m) => m.userId !== userId),
        });
      },
    });
  }

  prepareDemoteOwner(userId: number, orgId: number): void {
    const org = this.organizationStore.selectedOrganization();
    if (!org || org.id !== orgId || org.owners.length <= 1) return;

    this.api.demoteOwnerToMember(userId, orgId).subscribe({
      next: (updatedMember) => {
        const ownerToDemote = org.owners.find((o) => o.userId === userId);
        const demotedUser = updatedMember?.id
          ? updatedMember
          : { ...ownerToDemote!, role: 'MEMBER' };

        this.organizationStore.selectedOrganization.set({
          ...org,
          owners: org.owners.filter((o) => o.userId !== userId),
          members: [...org.members, demotedUser],
        });
      },
    });
  }

  removeUserFromOrganization(userId: number, orgId: number): void {
    const org = this.organizationStore.selectedOrganization();
    if (!org || org.id !== orgId) return;

    const isOwner = org.owners.some((o) => o.userId === userId);
    if (isOwner && org.owners.length <= 1) return;

    this.api.removeUserFromOrganization(userId, orgId).subscribe({
      next: () => {
        this.organizationStore.selectedOrganization.set({
          ...org,
          owners: org.owners.filter((o) => o.userId !== userId),
          members: org.members.filter((m) => m.userId !== userId),
        });
        this.refreshOrganizations();
      },
    });
  }

  prepareDeleteOrganization(orgId: number): void {
    if (!orgId) return;
    const org = this.organizationStore.organizations().find((o) => o.id === orgId);
    if (!org) return;

    this.organizationStore.selectedOrganization.set({
      ...org,
      owners: [...org.owners],
      members: [...org.members],
    });
    this.viewStore.isModalDeleteOrganizationActive.set(true);
  }

  prepareDeleteMember(userId: number, orgId: number): void {
    this.removeUserFromOrganization(userId, orgId);
  }

  prepareDeleteOwner(userId: number, orgId: number): void {
    this.removeUserFromOrganization(userId, orgId);
  }

  prepareAddMember(orgId: number): void {
    if (!orgId) return;
    const org = this.organizationStore.organizations().find((o) => o.id === orgId);
    if (!org) return;

    this.organizationStore.selectedOrganization.set({
      ...org,
      owners: [...org.owners],
      members: [...org.members],
    });
    this.viewStore.isModalAddMemberActive.set(true);
  }

  prepareAddOwner(orgId: number): void {
    if (!orgId) return;
    const org = this.organizationStore.organizations().find((o) => o.id === orgId);
    if (!org) return;

    this.organizationStore.selectedOrganization.set({
      ...org,
      owners: [...org.owners],
      members: [...org.members],
    });
    this.viewStore.isModalAddOwnerActive.set(true);
  }

  confirmDeleteOrganization(): void {
    const org = this.organizationStore.selectedOrganization();
    if (!org) return;

    this.api.removeOrg(org.id).subscribe(() => {
      this.viewStore.isModalDeleteOrganizationActive.set(false);
      this.organizationStore.selectedOrganization.set(null);
      this.viewController.showSuccess('SUCCESS' as any);
    });
  }

  confirmDeleteMember(): void {
    const user = this.organizationStore.organizationListSelectedUser();
    const org = this.organizationStore.selectedOrganization();
    if (!user || !org) return;

    this.api.removeUserFromOrganization(user.id, org.id).subscribe(() => {
      this.viewStore.isModalDeleteMemberActive.set(false);
      this.organizationStore.organizationListSelectedUser.set(null);
      this.organizationStore.selectedOrganization.set(null);
      this.viewController.showSuccess('SUCCESS' as any);
      this.refreshOrganizations();
    });
  }

  confirmDeleteOwner(): void {
    const user = this.organizationStore.organizationListSelectedUser();
    const org = this.organizationStore.selectedOrganization();
    if (!user || !org || !user.id || !org.id) return;

    this.api.removeOwnerFromOrganization(user.id, org.id).subscribe(() => {
      this.viewStore.isModalDeleteOwnerActive.set(false);
      this.organizationStore.organizationListSelectedUser.set(null);
      this.organizationStore.selectedOrganization.set(null);
      this.viewController.showSuccess('SUCCESS' as any);
      this.refreshOrganizations();
    });
  }

  closeModals(): void {
    this.viewController.closeModals();
  }

  handleAddOrganization() {
    this.viewStore.isAdminAddOrganizationModalActive.set(true);
    this.router.navigate(['/admin/organizations']);
  }

  handleUserAddOrganization() {
    this.viewStore.isAdminAddOrganizationModalActive.set(true);
  }

  getOrganizations(withMembers: boolean, userId: number | null) {
    const page = this.organizationStore.currentOrganizationsPage();
    const size = this.organizationStore.currentOrganizationsSize();

    this.api.getOrganizations(page, size, withMembers, userId).subscribe({
      next: (pageData) => {
        this.organizationStore.organizationsPage.set(pageData);
      },
      error: (e) => console.error('Error in getOrganizations: ', e),
    });
  }
}
