import { Injectable, signal } from '@angular/core';
import { ReservationDto } from '../../model/reservationDto';
import { ConfirmationType } from '../../model/confirmationType';

@Injectable({ providedIn: 'root' })
export class ViewStore {
  readonly isConfirmationPopupActive = signal<boolean>(false);
  readonly errorPopupTitle = signal<string>('');
  readonly errorPopupBody = signal<string>('');
  readonly successPopupTitle = signal<string>('');
  readonly successPopupBody = signal<string>('');
  readonly confirmationPopupTitle = signal<string>('');
  readonly confirmationPopupBody = signal<string>('');
  readonly pendingConfirmationType = signal<ConfirmationType | null>(null);
  readonly pendingConfirmationReservation = signal<ReservationDto | null>(null);
  readonly displayErrorPopup = signal<boolean>(false);
  readonly isSuccessPopupActive = signal<boolean>(false);
  readonly isModalAddRoomActive = signal<boolean>(false);
  readonly isReservationDetailsModalActive = signal<boolean>(false);
  readonly isUserDetailsModalActive = signal<boolean>(false);
  readonly isBookingModalActive = signal<boolean>(false);
  readonly isLoginOrRegisterModalActive = signal<boolean>(false);
  readonly confirmMarkReservationAsAccepted = signal<boolean>(false);
  readonly confirmMarkReservationAsRequestCancel = signal<boolean>(false);
  readonly confirmMarkReservationAsCanceled = signal<boolean>(false);
  readonly confirmMarkReservationAsRejected = signal<boolean>(false);
  readonly popupConfirmationActive = signal<boolean | null>(null);

  // General Organization & User Modals
  readonly isAddOrganizationModalActive = signal<boolean>(false);
  readonly isOrganizationDetailsModalActive = signal<boolean>(false);
  readonly isModalAddMemberActive = signal<boolean>(false);
  readonly isModalAddOwnerActive = signal<boolean>(false);
  readonly isModalDeleteOwnerActive = signal<boolean>(false);
  readonly isModalDeleteMemberActive = signal<boolean>(false);
  readonly isModalDeleteOrganizationActive = signal<boolean>(false);
  readonly isAdminAddOrganizationModalActive = signal<boolean>(false);
  readonly isAdminOrganizationModalActive = signal<boolean>(false);
  readonly isBanUsersModalActive = signal<boolean>(false);

  // booking
  readonly displayBookingSuccesfulPopup = signal<boolean>(false);
  readonly isAdminAddOrganizationSuccessPopupActive = signal<boolean>(false);
  readonly isModalDeleteOwnerSuccessActive = signal<boolean>(false);
  readonly isModalDeleteOrganizationSuccessActive = signal<boolean>(false);
  readonly isModalDeleteMemberSuccessActive = signal<boolean>(false);
}
