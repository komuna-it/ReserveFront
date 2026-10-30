import { Component, computed, inject, OnInit } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { SettingsFacade } from '../../settings/settingsFacade';
import { SettingsStore } from '../../settings/settingsStore';
import { SettingKey } from '../../settings/model/settingKeys';

@Component({
  selector: 'contact-page',
  standalone: true,
  imports: [TranslocoModule],
  templateUrl: './contact.html',
})
export class ContactPage implements OnInit {
  private readonly settingsFacade = inject(SettingsFacade);
  private readonly settingsStore = inject(SettingsStore);

  readonly email = computed(
    () =>
      this.settingsStore.settings().find((setting) => setting.key === SettingKey.CONTACT_EMAIL)
        ?.value ?? '',
  );

  readonly phone = computed(
    () =>
      this.settingsStore.settings().find((setting) => setting.key === SettingKey.CONTACT_PHONE)
        ?.value ?? '',
  );

  ngOnInit(): void {
    this.settingsFacade.getSettings(
      new Set([SettingKey.CONTACT_EMAIL, SettingKey.CONTACT_PHONE]),
      false,
    );
  }
}
