import { Component, inject, OnInit } from '@angular/core';
import { ReservationStore } from '../../reservation/reservation.store';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { OrganizationMemberDto } from '../../../model/organizationMemberDto';
import { AuthService } from '../../../auth/authService';

@Component({
  selector: 'app-organization-members',
  imports: [TranslocoPipe],
  templateUrl: './organization-members.html',
  styleUrl: './organization-members.css',
})
export class OrganizationMembers implements OnInit {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly translocoService = inject(TranslocoService);
  readonly loco = inject(TranslocoService);
  readonly auth = inject(AuthService);

  ngOnInit() {
    if (this.auth.currentUser()) {
      this.facade.getOrganizationsOfUser(true, this.auth.currentUser()?.id ?? 0);
    }
  }

  deleteTeamMember(userId: number) {
    console.log(`Trying to delete team member with id ${userId}`);
    this.facade.removeUserFromOrganization(userId, this.store.activeTab().org!.id);
  }

  getRoleText(user: OrganizationMemberDto): string {
    switch (user.role) {
      case 'USER':
        return this.loco.translate('PROFILE.ROLE_MEMBER');
      case 'OWNER':
        return this.loco.translate('PROFILE.ROLE_OWNER');
      default:
        return this.loco.translate('PROFILE.NO_ROLE');
    }
  }
}
