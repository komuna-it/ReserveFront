import { Component, effect, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { ReservationStore } from '../../services/reservation/reservation.store';
import { ReservationFacade } from '../../services/reservation/reservation.facade';
import { CalendarHelper } from '../../components/calendar/calendar.helper';
import { TranslocoPipe } from '@jsverse/transloco';
import { TextFormatingTool } from '../../tools/textFormatingTool';
import { ReservationStatus } from '../../model/reservationStatus';
import { User } from '../../model/user';
import { AuthService } from '../../auth/authService';
import { TableReservations } from '../../components/tables/table-reservations/table-reservations';
import { ReservationTableType } from '../../model/reservationTableType';
import { OrganizationFacade } from '../../services/organization/organization.facade';
import { UserFacade } from '../../services/user/user.facade';
import { UserStore } from '../../services/user/user.store';
import { OrganizationStore } from '../../services/organization/organization.store';
import { ViewController } from '../../services/view/view.controller';
import { ViewStore } from '../../services/view/view.store';

@Component({
  selector: 'app-user-details-modal',
  standalone: true,
  imports: [TranslocoPipe, TableReservations],
  templateUrl: './user-details-modal.html',
})
export class UserDetailsModal {
  readonly store = inject(ReservationStore);
  readonly userStore = inject(UserStore);
  readonly organizationStore = inject(OrganizationStore);
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);
  readonly facade = inject(ReservationFacade);
  readonly organizationFacade = inject(OrganizationFacade);
  readonly userFacade = inject(UserFacade);
  readonly helper = inject(CalendarHelper);
  readonly tool = inject(TextFormatingTool);
  readonly auth = inject(AuthService);
  readonly ReservationStatus = ReservationStatus;
  readonly textFormatingTool = inject(TextFormatingTool);

  readonly user = input.required<User | null>();
  readonly resTableType = ReservationTableType.ADMIN_USER_DETAILS;
  readonly isMenuOpen = signal<boolean>(false);
  private elementRef = inject(ElementRef);

  toggleMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  promoteToAdmin(userId: number): void {
    this.userFacade.promoteUserToAdmin(userId);
    this.closeMenu();
  }

  demoteFromAdmin(userId: number): void {
    this.userFacade.demoteAdminToUser(userId);
    this.closeMenu();
  }

  constructor() {
    effect(() => {
      const currentUser = this.userStore.selectedUser();
      if (currentUser) {
        console.log('UserDetailsModal Getting all reservations for user: ', currentUser.id);
        this.facade.getReservations({
          future: this.store.toolbarOnlyFuture(),
          userId: currentUser.id,
        });
        console.log('UserDetailsModal Getting all organizations for user: ', currentUser.id);
        this.organizationFacade.getOrganizations(false, currentUser.id);
      }
      console.table(currentUser);
    });
  }
}
