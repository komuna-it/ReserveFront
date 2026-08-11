import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ReservationStore } from '../reservation/reservation.store';
import { ReservationFacade } from '../reservation/reservation.facade';
import { AuthService } from '../../auth/authService';

@Component({
  selector: 'app-user-settings',
  imports: [TranslocoPipe],
  templateUrl: './user-settings.html',
  styleUrl: './user-settings.css',
})
export class UserSettings {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly auth = inject(AuthService);

  user = this.auth.currentUser();
  languageFromSelect = '';

  // alreadyPreferredLanguage = this.user?.preferredLanguage;
  alreadyPreferredLanguage = 'pl';

  onLanguageSelect(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newLanguage = String(selectElement.value);

    if (newLanguage) {
      this.facade.setPreferredLanguage(newLanguage);
    }
  }
}
