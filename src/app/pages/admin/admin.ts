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

@Component({
  selector: 'app-admin',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
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

  handleAddOrganization() {
    this.store.isAdminAddOrganizationActive.set(true);
    this.router.navigate(['/admin/organizations']);
  }

  ngOnInit() {
    this.facade.getReservationsByStatus(ReservationStatus.CREATED);
    this.facade.getAllUsers();
  }

  bandText(res: ReservationDto): string {
    return (
      this.store.allOrganizations().find((o) => o.id === res.organization)?.name ?? 'brak nazwy'
    );
  }

  reservedByText(res: ReservationDto): string {
    return this.store.allUsers().find((u) => u.id === res.reservedBy)?.nick ?? 'brak nicku';
  }

  dateColumnText(res: ReservationDto): string {
    return this.calendarHelper.generateDayLabel(res.startAt);
  }

  startAtText(res: ReservationDto) {
    return this.calendarHelper.generateHourLabel(res.startAt);
  }

  endAtText(res: ReservationDto) {
    return this.calendarHelper.generateHourLabel(res.endAt);
  }

  privateReservationText(res: ReservationDto) {
    return res.organization === null
      ? this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.IS_PRIVATE')
      : this.translocoService.translate('ADMIN_PENDING_RESERVATIONS.IS_NOT_PRIVATE');
  }

  handleClickAcceptReservation(res: ReservationDto) {
    this.store.confirmMarkReservationAsAccepted.set(true);
    this.store.selectedReservation.set(res);
  }

  handleAcceptReservation(res: ReservationDto) {
    this.facade.markReservationAsAccepted(res.id);
    this.store.confirmMarkReservationAsAccepted.set(false);
    this.store.popupMarkedReservationAsAccepted.set(true);
  }

  handleClickCancelReservation(res: ReservationDto) {
    this.store.confirmMarkReservationAsCanceled.set(true);
    this.store.selectedReservation.set(res);
  }

  handleCancelReservation(res: ReservationDto) {
    this.facade.markReservationAsCanceled(res.id);
    this.store.confirmMarkReservationAsCanceled.set(false);
    this.store.popupMarkedReservationAsCanceled.set(true);
  }

  closeModals() {
    this.store.globalErrorKey.set(null);
    this.store.confirmMarkReservationAsAccepted.set(false);
    this.store.confirmMarkReservationAsRequestCancel.set(false);
    this.store.confirmMarkReservationAsCanceled.set(false);

    this.store.popupMarkedReservationAsAccepted.set(false);
    this.store.popupMarkedReservationAsRequestCancel.set(false);
    this.store.popupMarkedReservationAsCanceled.set(false);
  }
}
