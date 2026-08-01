import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef,
  HostListener,
  input,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/authService';
import { OrganizationList } from './components/organization-list/organization-list';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ReservationDto } from '../../model/reservationDto';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { TranslocoService } from '@jsverse/transloco';
import { CalendarHelper } from '../../components/calendar/calendar.helper';
import { ReservationStatus } from '../../model/reservationStatus';
import { ConfirmationPopup } from '../../modals/confirmation-popup/confirmation-popup';
import { TextFormatingTool } from '../../tools/textFormatingTool';

@Component({
  selector: 'app-admin',
  imports: [ConfirmationPopup, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminPage {
  readonly store = inject(ReservationStore);
  readonly isMobileMenuOpen = signal<boolean>(false);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);
  readonly translocoService = inject(TranslocoService);
  readonly calendarHelper = inject(CalendarHelper);
  readonly textFormatingTool = inject(TextFormatingTool);
  readonly reservation = input<any | null>;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.closeMobileMenu();
      });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((isOpen) => !isOpen);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (window.innerWidth >= 768 && this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }

  ngOnInit() {
    this.facade.getReservationsByStatus(ReservationStatus.CREATED);
    this.facade.getAllUsers();
  }

  // buttons

  getTitleText(): string {
    if (this.store.confirmMarkReservationAsAccepted()) {
      return this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.CONFIRM_ACCEPT_TITLE');
    } else if (this.store.confirmMarkReservationAsRequestCancel()) {
      return this.translocoService.translate(
        'ADMIN_PENDING_RESERVATIONS.CONFIRM_REQUEST_CANCEL_TITLE',
      );
    } else if (this.store.confirmMarkReservationAsCanceled()) {
      return this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.CONFIRM_CANCEL_TITLE');
    }
    return '';
  }

  getBodyText(): string {
    const res = this.store.selectedReservation();
    if (!res) return '';

    const params = {
      organization: this.textFormatingTool.bandText(res),
      date: this.textFormatingTool.dateColumnText(res),
      startHour: this.textFormatingTool.startAtText(res),
      endHour: this.textFormatingTool.endAtText(res),
    };

    if (this.store.confirmMarkReservationAsAccepted()) {
      return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_ACCEPT_BODY', params);
    } else if (this.store.confirmMarkReservationAsRequestCancel()) {
      return this.translocoService.translate(
        'ADMIN_RESERVATIONS.CONFIRM_REQUEST_CANCEL_BODY',
        params,
      );
    } else if (this.store.confirmMarkReservationAsCanceled()) {
      return this.translocoService.translate('ADMIN_RESERVATIONS.CONFIRM_CANCEL_BODY', params);
    }

    return '';
  }
}
