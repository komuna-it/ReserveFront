import { signal, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/authService';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../components/reservation/reservation.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar {
  readonly authService = inject(AuthService);
  readonly translocoService = inject(TranslocoService);
  readonly isLangMenuOpen = signal(false);
  readonly isMobileMenuOpen = signal(false);

  readonly store = inject(ReservationStore);

  changeLang(lang: string) {
    this.translocoService.setActiveLang(lang);
    this.isLangMenuOpen.set(false);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  logout() {
    this.authService.logout();
    this.closeMobileMenu();
    console.log('navbar: User logged out');
  }
}
