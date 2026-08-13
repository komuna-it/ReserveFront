import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { AuthService } from '../../auth/authService';
import { UserSettings } from '../../components/user-settings/user-settings';

@Component({
  selector: 'app-user-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './user-sidebar.html',
  styleUrl: './user-sidebar.css',
})
export class UserSidebar {
  readonly store = inject(ReservationStore);
  readonly authService = inject(AuthService);
  readonly facade = inject(ReservationFacade);
  readonly isMobileMenuOpen = signal<boolean>(false);

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.closeMobileMenu());
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
