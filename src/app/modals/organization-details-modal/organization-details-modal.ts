import { Component, computed, effect, inject, input } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { Organization } from '../../model/organization';
import { TableReservationsAdmin } from '../../components/tables/table-reservations-admin/table-reservations-admin';
import { OrganizationMemberDto } from '../../model/organizationMemberDto';
import { User } from '../../model/user';

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
  readonly loco = inject(TranslocoService);

  readonly organization = computed(() => this.store.selectedOrganization()!);
  readonly owners = computed(() => this.organization().owners);
  readonly members = computed(() => this.organization().members);

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
