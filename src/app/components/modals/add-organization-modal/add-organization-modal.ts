import { Component, HostListener, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../reservation/reservation.store';
import { ReservationFacade } from '../../reservation/reservation.facade';

@Component({
  selector: 'app-add-organization-modal',
  imports: [TranslocoPipe],
  templateUrl: './add-organization-modal.html',
  styleUrl: './add-organization-modal.css',
})
export class AddOrganizationModal {
  readonly loco = inject(TranslocoService);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);

  @HostListener('document:keydown.escape')
  onKeydownHandler(): void {
    this.closeModals();
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
    this.store.modalAddOrganizationActive.set(false);
  }
}
