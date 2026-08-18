import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { ReservationStore } from '../../reservation/reservation.store';
import { AuthService } from '../../../auth/authService';

@Component({
  selector: 'app-add-user-into-organization-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './add-user-into-organization-modal.html',
  styleUrl: './add-user-into-organization-modal.css',
})
export class AddUserIntoOrganizationModal implements OnInit, OnDestroy {
  readonly facade = inject(ReservationFacade);
  readonly store = inject(ReservationStore);
  readonly auth = inject(AuthService);

  readonly type = input.required<'member' | 'owner' | string>();

  ngOnInit(): void {
    this.facade.getAllUsers();
    this.store.organizationListSelectedUser.set(null);
  }

  readonly role = computed(() => {
    return this.type().toUpperCase();
  });

  ngOnDestroy(): void {
    this.store.organizationListSelectedUser.set(null);
  }

  readonly usersToAddIntoOrganization = computed(() => {
    const availableUsers = this.store.users() ?? [];
    const selectedOrg = this.store.selectedOrganization();

    if (!selectedOrg) {
      return availableUsers;
    }

    const existingUserIds = new Set([
      ...(selectedOrg.members?.map((m) => m.userId) ?? []),
      ...(selectedOrg.owners?.map((o) => o.userId) ?? []),
    ]);

    return availableUsers.filter((user) => user.id !== undefined && !existingUserIds.has(user.id));
  });

  cancel(): void {
    this.store.isModalAddMemberActive.set(false);
    this.store.isModalAddOwnerActive.set(false);
    this.store.isModalAddOwnerActive.set(false);
    this.store.organizationListSelectedUser.set(null);
  }

  confirm(): void {
    const selectedUser = this.store.organizationListSelectedUser();
    const selectedOrg = this.store.selectedOrganization();

    if (!selectedUser?.id || !selectedOrg?.id) {
      return;
    }

    if (this.type() === 'owner') {
      this.facade.addOwnerToOrganization(selectedUser.id, selectedOrg.id);
    } else {
      this.facade.addMemberToOrganization(selectedUser.id, selectedOrg.id);
    }
  }
}
