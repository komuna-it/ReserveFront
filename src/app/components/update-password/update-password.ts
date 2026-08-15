import { Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../reservation/reservation.store';
import { ReservationFacade } from '../reservation/reservation.facade';
import { AuthService } from '../../auth/authService';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-update-password',
  imports: [FormsModule, TranslocoPipe],
  templateUrl: './update-password.html',
  styleUrl: './update-password.css',
})
export class UpdatePassword {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly auth = inject(AuthService);
  readonly transloco = inject(TranslocoService);

  oldPassword = '';
  newPassword = '';
  secondNewPassword = '';
  readonly errorString = signal<string>('');
  readonly successString = signal<string>('');

  send() {
    const matches = this.isNewPasswordMatching(this.newPassword, this.secondNewPassword);
    if (matches) {
      this.handleUpdatePassword(this.oldPassword, this.newPassword);
    }
  }

  isNewPasswordMatching(newPassword: string, secondNewPassword: string): boolean {
    if (newPassword === secondNewPassword) {
      return true;
    } else {
      this.errorString.set('COMMON.ERROR_MATCHING_PASSWORD');
    }
    return false;
  }

  handleUpdatePassword(old: string, newPassword: string) {
    this.auth.handleUpdatePassword(old, newPassword).subscribe({
      next: () => {
        console.info('success update password');
        this.successString.set('COMMON.SUCCESS_UPDATING_PASSWORD');
      },
      error: (e) => {
        console.error('error updating password', e);
        this.errorString.set('Error updating password, try again later');
        this.errorString.set('COMMON.ERROR_UPDATING_PASSWORD');
      },
    });
  }
}
