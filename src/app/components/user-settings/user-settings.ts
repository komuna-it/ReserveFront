import { Component, computed, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../services/reservation/reservation.store';
import { ReservationFacade } from '../../services/reservation/reservation.facade';
import { AuthService } from '../../auth/authService';
import { SettingsFacade } from '../../settings/settingsFacade';
import { SettingsStore } from '../../settings/settingsStore';
import { UserFacade } from '../../services/user/user.facade';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './user-settings.html',
  styleUrl: './user-settings.css',
})
export class UserSettings {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly userFacade = inject(UserFacade);
  readonly settingsFacade = inject(SettingsFacade);
  readonly settingsStore = inject(SettingsStore);
  readonly auth = inject(AuthService);
  readonly transloco = inject(TranslocoService);

  readonly currentLanguage = computed(
    () => this.auth.currentUser()?.preferredLanguage || this.transloco.getActiveLang(),
  );

  onLanguageSelect(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newLanguage = String(selectElement.value);

    if (newLanguage) {
      this.transloco.setActiveLang(newLanguage);

      this.userFacade.setPreferredLanguage(newLanguage);
    }
  }

  handleDeleteAccount() {
    this.settingsStore.isDeleteAccountConfirmationModalActive.set(true);
    this.auth.logout();
  }
}
