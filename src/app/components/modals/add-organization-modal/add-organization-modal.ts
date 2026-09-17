import { Component, HostListener, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../reservation/reservation.store';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { ConfirmationPopup } from '../../../modals/confirmation-popup/confirmation-popup';
import { SuccessType } from '../../../model/successType';

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
    this.facade.closeModals();
  }

  createOrganization(name: string): void {
    if (!name || name.trim() === '') return;

    try {
      this.facade.createOrganization(name.trim());
      this.facade.showSuccess(SuccessType.ORGANIZATION_ADDED_TITLE);
      this.store.isAddOrganizationModalActive.set(false);
      this.store.isAdminAddOrganizationModalActive.set(false);
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  }
}
