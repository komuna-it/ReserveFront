import { Component, effect, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { SettingsStore } from '../../../../settings/settingsStore';
import { SettingsFacade } from '../../../../settings/settingsFacade';
import { Setting } from '../../../../settings/model/setting';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [TranslocoPipe, ReactiveFormsModule],
  templateUrl: './admin-settings.html',
})
export class AdminSettings implements OnInit {
  readonly settingsStore = inject(SettingsStore);
  readonly settingsFacade = inject(SettingsFacade);
  private readonly fb = inject(NonNullableFormBuilder);

  form = this.fb.record<string>({});

  constructor() {
    effect(() => {
      const settings = this.settingsStore.settings();

      Object.keys(this.form.controls).forEach((key) => {
        this.form.removeControl(key);
      });

      settings.forEach((s) => {
        this.form.addControl(s.key, this.fb.control(s.value));
      });
    });
  }

  ngOnInit(): void {
    this.settingsFacade.getSettings(null, true);
  }

  onSave(): void {
    const formValues = this.form.value;
    const settingsToUpdate = new Set<Setting>();

    this.settingsStore.settings().forEach((originalSetting) => {
      const newValue = formValues[originalSetting.key];

      if (newValue !== undefined && newValue !== originalSetting.value) {
        settingsToUpdate.add({ key: originalSetting.key, value: newValue });
      }
    });

    if (settingsToUpdate.size > 0) {
      this.settingsFacade.updateSettings(settingsToUpdate);
    }
  }
}
