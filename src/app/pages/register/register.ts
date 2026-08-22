import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/authService';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { SettingsStore } from '../../settings/settingsStore';
import { SettingsFacade } from '../../settings/settingsFacade';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../../model/error/errorResponse';
// Import your API/Facade service here
// import { ApiService } from '../../api.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, TranslocoPipe],
  standalone: true,
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterPage {
  readonly settingsStore = inject(SettingsStore);
  readonly settingsFacade = inject(SettingsFacade);

  email = '';
  name = '';
  password = '';
  language = '';

  // State for the new checkbox
  policyAccepted = false;

  readonly fieldErrors = signal<Record<string, string[]>>({});
  readonly generalError = signal<string>('');

  readonly registerSuccess = signal<boolean>(false);

  // State for the privacy policy modal & HTML content
  readonly isPrivacyPolicyOpen = signal<boolean>(false);
  readonly privacyPolicyHtml = signal<string>('Loading privacy policy...');

  constructor(
    private authService: AuthService,
    private router: Router,
    private translocoService: TranslocoService,
  ) {
    const lang = this.translocoService.getActiveLang();
    if (lang) {
      this.translocoService.setActiveLang(lang);
    }
  }

  async register() {
    this.generalError.set('');
    this.fieldErrors.set({});

    if (!this.policyAccepted) {
      this.generalError.set('You must accept the privacy policy to register.');
      return;
    }

    this.authService
      .register(this.email, this.password, this.name, this.translocoService.getActiveLang())
      .subscribe({
        next: () => {
          this.registerSuccess.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.handleErrorResponse(error);
        },
      });
  }

  private handleErrorResponse(error: HttpErrorResponse): void {
    const errorResponse = error.error as ErrorResponse;

    if (error.status === 400 && errorResponse?.body?.errors) {
      const backendErrors = errorResponse.body.errors;

      const translatedErrors: Record<string, string[]> = {};

      if ('password' in backendErrors) {
        translatedErrors['password'] = [
          this.translocoService.translate('ERRORS.PASSWORD_INSTRUCTIONS'),
        ];
      }

      if ('email' in backendErrors) {
        translatedErrors['email'] = [this.translocoService.translate('ERRORS.EMAIL_INSTRUCTIONS')];
      }

      this.fieldErrors.set(translatedErrors);
      return;
    }

    if (error.status === 409) {
      this.generalError.set(this.translocoService.translate('REGISTER.EMAIL_EXISTS'));
    } else if (errorResponse?.message) {
      this.generalError.set(errorResponse.message);
    } else {
      this.generalError.set(this.translocoService.translate('REGISTER.ERROR_CONFLICT'));
    }
  }

  getFieldErrors(fieldName: string): string[] {
    return this.fieldErrors()[fieldName] || [];
  }

  viewPrivacyPolicy(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.settingsFacade.getPrivacyPolicy();
  }
}
