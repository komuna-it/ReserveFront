import { inject, Injectable } from '@angular/core';
import { TextFormatingTool } from '../../tools/textFormatingTool';
import { ConfirmationType } from '../../model/confirmationType';
import { ReservationDto } from '../../model/reservationDto';
import { ViewStore } from './view.store';
import { TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../auth/authService';
import { ErrorType } from '../../model/error/errorType';
import { SuccessType } from '../../model/successType';

@Injectable({ providedIn: 'root' })
export class ViewController {
  private authService = inject(AuthService);
  private loco = inject(TranslocoService);
  readonly textFormatingTool = inject(TextFormatingTool);
  readonly viewStore = inject(ViewStore);

  handleConfirmationCancel(): void {
    this.viewStore.isConfirmationPopupActive.set(false);
    this.viewStore.pendingConfirmationType.set(null);
    this.viewStore.pendingConfirmationReservation.set(null);
  }

  showConfirmation(type: ConfirmationType, res: ReservationDto) {
    this.viewStore.pendingConfirmationType.set(type);
    this.viewStore.pendingConfirmationReservation.set(res);

    const params = {
      organization: this.textFormatingTool.reservationDetailsModalOrganizationText(res),
      date: this.textFormatingTool.dateColumnText(res),
      startHour: this.textFormatingTool.startAtText(res),
      endHour: this.textFormatingTool.endAtText(res),
      reservedBy: this.textFormatingTool.reservationDetailsModalReservedByText(res),
    };

    let titleTranslated = this.loco.translate(`CONFIRMATION.${type}.TITLE`);
    let bodyTranslated = this.loco.translate(`CONFIRMATION.${type}.BODY`, params);

    if (type === ConfirmationType.RESERVATION_CANCEL && this.authService.isAdmin()) {
      bodyTranslated =
        res.organization === null || res.organization === undefined
          ? this.loco.translate(`CONFIRMATION.${type}.BODY_PRIVATE_ADMIN`, params)
          : this.loco.translate(`CONFIRMATION.${type}.BODY_ORGANIZATION_ADMIN`, params);
    }

    this.viewStore.confirmationPopupTitle.set(titleTranslated);
    this.viewStore.confirmationPopupBody.set(bodyTranslated);
    this.viewStore.isConfirmationPopupActive.set(true);
  }

  showError(error: ErrorType) {
    this.viewStore.errorPopupTitle.set(this.loco.translate(`ERRORS.${error}`));
    this.viewStore.displayErrorPopup.set(true);
  }

  showSuccess(title: SuccessType | any, bodyText: string = '') {
    const key = typeof title === 'string' ? title : title?.type || 'SUCCESS';
    this.viewStore.successPopupTitle.set(this.loco.translate(`SUCCESS.${key}`));
    this.viewStore.successPopupBody.set(bodyText);
    this.viewStore.isSuccessPopupActive.set(true);
  }

  closeModals(): void {
    this.viewStore.isConfirmationPopupActive.set(false);
    this.viewStore.pendingConfirmationType.set(null);
    this.viewStore.pendingConfirmationReservation.set(null);
    this.viewStore.popupConfirmationActive.set(false);
    this.viewStore.isModalAddRoomActive.set(false);
    this.viewStore.confirmMarkReservationAsRequestCancel.set(false);
    this.viewStore.isBookingModalActive.set(false);
    this.viewStore.isLoginOrRegisterModalActive.set(false);
    this.viewStore.isReservationDetailsModalActive.set(false);
    this.viewStore.confirmMarkReservationAsAccepted.set(false);
    this.viewStore.confirmMarkReservationAsRejected.set(false);
    this.viewStore.confirmMarkReservationAsCanceled.set(false);

    this.viewStore.isAddOrganizationModalActive.set(false);
    this.viewStore.isOrganizationDetailsModalActive.set(false);
    this.viewStore.isModalAddMemberActive.set(false);
    this.viewStore.isModalAddOwnerActive.set(false);
    this.viewStore.isModalDeleteOwnerActive.set(false);
    this.viewStore.isModalDeleteMemberActive.set(false);
    this.viewStore.isModalDeleteOrganizationActive.set(false);
    this.viewStore.isAdminAddOrganizationModalActive.set(false);
    this.viewStore.isAdminOrganizationModalActive.set(false);
    this.viewStore.isBanUsersModalActive.set(false);
    this.viewStore.isUserDetailsModalActive.set(false);
    this.viewStore.isSuccessPopupActive.set(false);
    this.viewStore.displayErrorPopup.set(false);

    this.viewStore.isAdminAddOrganizationSuccessPopupActive.set(false);
    this.viewStore.isModalDeleteOwnerSuccessActive.set(false);
    this.viewStore.isModalDeleteOrganizationSuccessActive.set(false);
    this.viewStore.isModalDeleteMemberSuccessActive.set(false);
  }
}
