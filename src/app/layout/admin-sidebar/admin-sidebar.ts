import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { filter } from 'rxjs';
import { ReservationFacade } from '../../components/reservation/reservation.facade';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css',
})
export class AdminSidebar {
  readonly store = inject(ReservationStore);
  readonly isMobileMenuOpen = signal<boolean>(false);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly facade = inject(ReservationFacade);

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
}
