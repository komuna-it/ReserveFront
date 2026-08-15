import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../auth/authService';
import { ReservationStore } from '../../components/reservation/reservation.store';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, TranslocoPipe],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly store = inject(ReservationStore);
  private readonly loco = inject(TranslocoService);

  readonly email = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly errorString = signal<string>('');
  readonly successString = signal<string>('');

  send() {
    if (!this.email()) {
      return;
    }

    this.isLoading.set(true);
    this.errorString.set('');
    this.successString.set('');

    this.authService.handleForgotPassword(this.email()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successString.set(this.loco.translate('FORGOT_PASSWORD.SUCCESS_MESSAGE'));
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorString.set(
          err?.error?.message || this.loco.translate('FORGOT_PASSWORD.ERROR_GENERIC'),
        );
      },
    });
  }
}
