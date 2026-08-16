import { Component, computed, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { AuthService } from '../../../../auth/authService';
import { SettingsStore } from '../../../../settings/settingsStore';
import { SettingsFacade } from '../../../../settings/settingsFacade';

@Component({
  selector: 'app-admin-settings',
  imports: [TranslocoPipe],
  templateUrl: './admin-settings.html',
})
export class AdminSettings {
  readonly store = inject(ReservationStore);
  readonly settingsStore = inject(SettingsStore);
  readonly facade = inject(ReservationFacade);
  readonly settingsFacade = inject(SettingsFacade);
  readonly auth = inject(AuthService);
  readonly transloco = inject(TranslocoService);

  readonly currentLanguage = computed(
    () => this.auth.currentUser()?.preferredLanguage || this.transloco.getActiveLang(),
  );

  constructor() {
    this.settingsFacade.getSettings(null, true);
  }
  onLanguageSelect(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newLanguage = String(selectElement.value);

    if (newLanguage) {
      this.transloco.setActiveLang(newLanguage);

      this.facade.setPreferredLanguage(newLanguage);
    }
  }
}
