import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { ReservationStore } from '../../reservation/reservation.store';
import { filter } from 'rxjs';
import { User } from '../../../model/user';

@Component({
  selector: 'app-add-user-into-organization-modal',
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './add-user-into-organization-modal.html',
  styleUrl: './add-user-into-organization-modal.css',
})
export class AddUserIntoOrganizationModal implements OnInit, OnDestroy {
  readonly facade = inject(ReservationFacade);
  readonly store = inject(ReservationStore);
  ngOnInit(): void {
    this.facade.getAllUsers();
    console.log('State of all users: ' + this.store.allUsers());
  }

  ngOnDestroy(): void {}

  readonly allUsersSafe = computed(() => {
    const users = this.store.allUsers();

    return users.filter((u) => u.nick != 'SYSTEM');
  });

  readonly selectedOrganization = computed(() => {
    const org = this.store.organizationListSelectedOrganization();
    if (!org) return null;

    return org;
  });

  cancel() {
    this.store.modalAddMemberActive.set(false);
  }

  confirm() {
    console.log(
      'State: ' +
        'this.store.organizationListSelectedUser: ' +
        this.store.organizationListSelectedUser() +
        ' ,organizationListSelectedOrganization: ' +
        this.store.organizationListSelectedOrganization() +
        ' , this.store.organizationListSelectedUser()?.id=' +
        this.store.organizationListSelectedUser()?.id,
    );

    if (
      this.store.organizationListSelectedUser() &&
      this.store.organizationListSelectedOrganization()
    ) {
      this.facade.addUserIntoOrganization(
        this.store.organizationListSelectedUser()?.id ?? 0,
        this.store.organizationListSelectedOrganization()?.id ?? 0,
      );
      this.store.modalAddMemberActive.set(false);
    }
  }
}
