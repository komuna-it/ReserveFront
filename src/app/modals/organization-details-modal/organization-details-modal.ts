import { Component, computed, effect, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { Organization } from '../../model/organization';
import { TableReservationsAdmin } from '../../components/tables/table-reservations-admin/table-reservations-admin';
import { User } from '../../model/user';
import { AuthService } from '../../auth/authService';

@Component({
  selector: 'app-organization-details-modal',
  standalone: true,
  imports: [TranslocoPipe, TableReservationsAdmin],
  templateUrl: './organization-details-modal.html',
  styleUrl: './organization-details-modal.css',
})
export class OrganizationDetailsModal {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly auth = inject(AuthService);
  readonly loco = inject(TranslocoService);

  readonly organization = computed(() => this.store.selectedOrganization()!);
  readonly owners = computed(() => this.organization().owners);
  readonly members = computed(() => this.organization().members);

  readonly currentUser = computed(() => this.auth.currentUser());

  readonly isAdmin = computed(() => this.auth.isAdmin() || this.currentUser()?.role === 'ADMIN');

  readonly isOwner = computed(() => {
    const userId = this.currentUser()?.id;
    if (!userId) return false;
    return this.owners().some((o) => o.userId === userId || o.id === userId);
  });

  readonly canManageMembers = computed(() => this.isAdmin() || this.isOwner());

  isDeleteOwnerButtonActive = computed(() => this.owners().length >= 2);

  constructor() {
    effect(() => {
      const org = this.store.selectedOrganization();
      console.log('Modal sees new organization', org);
    });
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

  userTrustedButtonText(user: User) {
    return user.trusted
      ? this.loco.translate('ORGANIZATION_LIST.MARK_AS_NOT_TRUSTED')
      : this.loco.translate('ORGANIZATION_LIST.MARK_AS_TRUSTED');
  }

  userTrustedText(user: User) {
    return user.trusted
      ? this.loco.translate('ORGANIZATION_LIST.NOT_TRUSTED')
      : this.loco.translate('ORGANIZATION_LIST.TRUSTED');
  }

  getOrganizationAddedTitleText() {
    return this.loco.translate('ORGANIZATION_LIST.SUCCESS_TITLE');
  }

  getDeleteOrganizationSuccessTitleText() {
    return this.loco.translate('ORGANIZATION_LIST.DELETE_ORGANIZATION.SUCCESS_TITLE');
  }

  getDeleteOwnerSuccessTitleText() {
    return this.loco.translate('ORGANIZATION_LIST.DELETE_OWNER.SUCCESS_TITLE');
  }

  getDeleteMemberSuccessTitleText() {
    return this.loco.translate('ORGANIZATION_LIST.DELETE_MEMBER.SUCCESS_TITLE');
  }
}
