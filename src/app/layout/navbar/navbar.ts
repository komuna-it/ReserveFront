import { signal, Component, inject, effect } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/authService';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';

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
  readonly facade = inject(ReservationFacade);
  readonly isLangMenuOpen = signal(false);
  readonly isMobileMenuOpen = signal(false);

  readonly store = inject(ReservationStore);

  constructor() {

    if (this.authService.currentUser()) {
      const lang = this.authService.currentUser()?.preferredLanguage as string;
      if(lang)
      {
        this.changeLang(lang)
      }
    }
    else {
      this.changeLang('pl');
    }
  }
  
  changeLang(lang: string) {
    this.translocoService.setActiveLang(lang);
    this.isLangMenuOpen.set(false);
    this.facade.setPreferredLanguage(lang);
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
