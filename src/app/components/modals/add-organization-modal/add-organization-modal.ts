import { Component, HostListener, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../reservation/reservation.store';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { ConfirmationPopup } from '../../../modals/confirmation-popup/confirmation-popup';

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

  readonly titleText = this.loco.translate('ORGANIZATION_LIST.TITLE');
  readonly bodyText = this.loco.translate('ORGANIZATION_LIST.BAND_NAME');

  @HostListener('document:keydown.escape')
  onKeydownHandler(): void {
    this.closeModals();
  }

  createOrganization(name: string): void {
    if (!name || name.trim() === '') return;

    try {
      this.facade.createOrganization(name.trim());
      this.store.popupConfirmationActive.set(true);
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  }

  closeModals(): void {
    this.store.isAdminAddOrganizationModalActive.set(false);
    this.store.isAdminAddOrganizationSuccessPopupActive.set(false);

    this.store.isModalDeleteOwnerActive.set(false);
    this.store.isModalDeleteMemberActive.set(false);
    this.store.isModalDeleteOrganizationActive.set(false);

    this.store.isModalDeleteOrganizationSuccessActive.set(false);
    this.store.isModalDeleteMemberSuccessActive.set(false);
    this.store.isModalDeleteOwnerSuccessActive.set(false);

    this.store.globalErrorKey.set(null);
    this.store.isAddOrganizationModalActive.set(false);
    this.store.popupConfirmationActive.set(false);
  }
}
