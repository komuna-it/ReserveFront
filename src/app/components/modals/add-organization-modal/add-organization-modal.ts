import { Component, HostListener, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../../services/reservation/reservation.store';
import { ReservationFacade } from '../../../services/reservation/reservation.facade';
import { ConfirmationPopup } from '../../../modals/confirmation-popup/confirmation-popup';
import { SuccessType } from '../../../model/successType';
import { OrganizationFacade } from '../../../services/organization/organization.facade';
import { ViewStore } from '../../../services/view/view.store';
import { ViewController } from '../../../services/view/view.controller';

@Component({
  selector: 'app-add-organization-modal',
  imports: [TranslocoPipe],
  templateUrl: './add-organization-modal.html',
})
export class AddOrganizationModal {
  readonly loco = inject(TranslocoService);
  readonly store = inject(ReservationStore);
  readonly organizationFacade = inject(OrganizationFacade);
  readonly facade = inject(ReservationFacade);
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);

  readonly titleText = this.loco.translate('ORGANIZATION_LIST.TITLE');
  readonly bodyText = this.loco.translate('ORGANIZATION_LIST.BAND_NAME');

  @HostListener('document:keydown.escape')
  onKeydownHandler(): void {
    this.viewController.closeModals();
  }

  createOrganization(name: string): void {
    if (!name || name.trim() === '') return;

    try {
      this.organizationFacade.createOrganization(name.trim());
      this.viewController.showSuccess(SuccessType.ORGANIZATION_ADDED_TITLE);
      this.viewStore.isAddOrganizationModalActive.set(false);
      this.viewStore.isAdminAddOrganizationModalActive.set(false);
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  }
}
