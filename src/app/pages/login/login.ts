import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../auth/authService';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ErrorResponse } from '../../model/error/errorResponse';
import { ErrorType } from '../../model/error/errorType';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly store = inject(ReservationStore);
  private readonly loco = inject(TranslocoService);

  email = '';
  password = '';
  isLoading = false;
  rememberMe = true;
  readonly errorString = signal<string>('');

  login(): void {
    this.isLoading = true;
    this.errorString.set('');

    console.log('Attempting login with email:', this.email, ', rememberMe:', this.rememberMe);

    this.authService.login(this.email, this.password, this.rememberMe).subscribe({
      next: (user) => {
        this.isLoading = false;
        const lang = user.preferredLanguage;
        if (lang) {
          this.loco.setActiveLang(lang);
        }

        if (user.banDto) {
          console.log('Detected banned user on 200 OK response');
          this.errorString.set(this.formatBanMessage(user.banDto.banExpires));
          return;
        }

        console.log('Login successful, navigating to home page');
        this.router.navigate(['/']);
      },

      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.handleLoginError(err);
      },
    });
  }

  private handleLoginError(err: HttpErrorResponse): void {
    const errorBody = err.error as ErrorResponse;

    if (errorBody?.errorType === ErrorType.USER_BANNED && errorBody?.bannedUntil) {
      this.errorString.set(this.formatBanMessage(errorBody.bannedUntil));
      return;
    }

    if (err.status === 401 || err.status === 403) {
      this.errorString.set(
        errorBody?.message || this.loco.translate('LOGIN.ERRORS.INVALID_CREDENTIALS'),
      );
    } else if (err.status === 0) {
      this.errorString.set(this.loco.translate('LOGIN.ERRORS.NO_CONNECTION'));
    } else {
      this.errorString.set(
        errorBody?.message || this.loco.translate('LOGIN.ERRORS.UNEXPECTED_ERROR'),
      );
    }

    console.error('Login error:', err);
  }

  private formatBanMessage(bannedUntil: string | Date): string {
    const date = new Date(bannedUntil);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    const formattedDate = `${day}.${month}.${year}`;
    const formattedTime = `${hours}:${minutes}`;

    return this.loco.translate('LOGIN.ERRORS.BANNED_UNTIL', {
      date: formattedDate,
      time: formattedTime,
    });
  }
}
