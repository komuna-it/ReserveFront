import { signal, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/authService';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar {
  translocoService = inject(TranslocoService);
  isLangMenuOpen = signal(false);

  availableLangs = ['en', 'pl', 'ua'];
  changeLang(lang: string) {
    this.translocoService.setActiveLang(lang);
    this.isLangMenuOpen.set(false);
  }
  authService = inject(AuthService);

  isMobileMenuOpen = signal(false);

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
