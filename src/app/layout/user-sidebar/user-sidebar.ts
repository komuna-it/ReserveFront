import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { filter } from 'rxjs';
import { ReservationFacade } from '../../components/reservation/reservation.facade';

@Component({
  selector: 'app-user-sidebar',
  imports: [],
  templateUrl: './user-sidebar.html',
  styleUrl: './user-sidebar.css',
})
export class UserSidebar {
  readonly store = inject(ReservationStore);
  readonly isMobileMenuOpen = signal<boolean>(false);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly facade = inject(ReservationFacade);

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
