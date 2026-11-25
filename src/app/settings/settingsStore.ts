import { Component, computed, inject, Injectable, signal } from '@angular/core';
import { Setting } from './model/setting';
import { ToolbarType } from '../components/toolbars/toolbarType';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  readonly settings = signal<Setting[]>([]);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly loco = inject(TranslocoService);

  readonly isDeleteAccountConfirmationModalActive = signal<boolean>(false);
  readonly isPrivacyPolicyOpen = signal<boolean>(false);

  readonly privacyPolicy = signal<string>('');

  // ======= Sorting params

  readonly toolbarType = signal<ToolbarType | null>(null);

  readonly queryParams = toSignal(this.route.queryParams, {
    initialValue: {} as Params,
  });

  readonly currentSortBy = computed<string>(() => {
    switch (this.toolbarType()) {
      case ToolbarType.USERS:
        return (this.queryParams()['sortBy'] as string) ?? 'nick';
      case ToolbarType.RESERVATIONS:
        return (this.queryParams()['sortBy'] as string) ?? 'id';
      default:
        return (this.queryParams()['sortBy'] as string) ?? 'id';
    }
  });

  readonly currentSortDir = computed(
    () => (this.queryParams()['sortDir'] as 'asc' | 'desc') ?? 'desc',
  );

  currentYear = computed(() => {
    const now = new Date();
    return now.getFullYear();
  });

  // settings
  readonly availableLanguages = signal<string[]>(['pl', 'en', 'ua']);
  readonly selectedLanguage = this.loco.activeLang();
}
