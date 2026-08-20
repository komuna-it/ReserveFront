import { Component, Injectable, signal } from '@angular/core';
import { Setting } from './model/setting';

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  readonly settings = signal<Setting[]>([]);

  readonly isDeleteAccountConfirmationModalActive = signal<boolean>(false);
  readonly isPrivacyPolicyOpen = signal<boolean>(false);

  readonly privacyPolicy = signal<string>('');
}
