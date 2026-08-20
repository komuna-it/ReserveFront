import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/authService';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { SettingsStore } from '../../settings/settingsStore';
import { SettingsFacade } from '../../settings/settingsFacade';
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

  readonly errorString = signal<string>('');
  readonly registerSuccess = signal<boolean>(false);

  // State for the privacy policy modal & HTML content
  readonly isPrivacyPolicyOpen = signal<boolean>(false);
  readonly privacyPolicyHtml = signal<string>('Loading privacy policy...');

  constructor(
    private authService: AuthService,
    private router: Router,
    private translocoService: TranslocoService,
  ) {}

  async register() {
    this.errorString.set('');

    if (!this.policyAccepted) {
      this.errorString.set('You must accept the privacy policy to register.');
      return;
    }

    this.authService.register(this.email, this.password, this.name, this.language).subscribe({
      next: () => {
        this.registerSuccess.set(true);
      },
      error: (error) => {
        if (error.status === 409) {
          this.errorString.set(this.translocoService.translate('REGISTER.EMAIL_EXISTS'));
        } else if (error.status === 403 || error.status === 401 || error.status === 400) {
          this.errorString.set(
            error.error?.message || this.translocoService.translate('REGISTER.INVALID_DATA'),
          );
        } else {
          this.errorString.set(this.translocoService.translate('REGISTER.ERROR_CONFLICT'));
        }
      },
    });
  }

  viewPrivacyPolicy(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.settingsFacade.getPrivacyPolicy();
  }
}
