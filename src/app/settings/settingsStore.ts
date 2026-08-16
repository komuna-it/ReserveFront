import { Component, Injectable, signal } from '@angular/core';
import { Setting } from './model/setting';

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  readonly settings = signal<Setting[]>([]);
}
