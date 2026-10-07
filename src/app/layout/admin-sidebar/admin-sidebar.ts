import { Component, DestroyRef, effect, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ReservationStore } from '../../services/reservation/reservation.store';
import { filter } from 'rxjs';
import { ReservationFacade } from '../../services/reservation/reservation.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { ReservationStatus } from '../../model/reservationStatus';
import { OrganizationFacade } from '../../services/organization/organization.facade';
import { ViewStore } from '../../services/view/view.store';
import { ViewController } from '../../services/view/view.controller';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css',
})
export class AdminSidebar {
  readonly store = inject(ReservationStore);
  readonly isMobileMenuOpen = signal<boolean>(false);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly facade = inject(ReservationFacade);
  readonly organizationFacade = inject(OrganizationFacade);
  readonly ReservationStatus = ReservationStatus;
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);

  constructor() {
    this.facade.connectToReservationStream();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.closeMobileMenu();
      });
    this.facade.getReservationsCountByStatus();
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
}
