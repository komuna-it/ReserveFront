import { Component, inject, Injectable } from '@angular/core';
import { SettingsApi } from './settingsApi';
import { Setting } from './model/setting';
import { SettingsStore } from './settingsStore';

@Injectable({ providedIn: 'root' })
export class SettingsFacade {
  private api = inject(SettingsApi);
  private settingsStore = inject(SettingsStore);

  closeModals() {
    this.settingsStore.isDeleteAccountConfirmationModalActive.set(false);
  }

  getSettings(keys: Set<string> | null, all: boolean) {
    this.api.getSettings(keys, all).subscribe({
      next: (response) => {
        this.settingsStore.settings.set(response);
        console.log('downloaded settings:');
        console.table(response);
      },
      error: (e) => {
        console.error('error downloading settings', e);
      },
    });
  }

  getSetting(keys: Set<string>) {
    this.api.getSetting(keys).subscribe({
      next: (response) => {
        this.settingsStore.settings.set(response);
        console.log('downloaded setting:');
        console.table(response);
      },
      error: (e) => {
        console.error('error downloading setting', e);
      },
    });
  }

  updateSettings(settings: Set<Setting>) {
    this.api.updateSettings(settings).subscribe({
      next: (response) => {
        this.settingsStore.settings.set(response);
        console.log('downloaded updated settings:');
        console.table(response);
      },
      error: (e) => {
        console.error('error downloading settings', e);
      },
    });
  }

  deleteAccount() {
    this.api.deleteAccount().subscribe({
      next: (response) => {
        console.log('deleteAccount success');
        console.table(response);
      },
      error: (e) => {
        console.error('error deleteAccount', e);
      },
    });
    this.settingsStore.isDeleteAccountConfirmationModalActive.set(false);
  }

  getPrivacyPolicy() {
    this.api.getPrivacyPolicy().subscribe({
      next: (response) => {
        this.settingsStore.privacyPolicy.set(response);
        this.settingsStore.isPrivacyPolicyOpen.set(true);
        console.log('getPrivacyPolicy:');
        console.table(response);
      },
      error: (e) => {
        console.error('error getPrivacyPolicy', e);
      },
    });
  }
}
