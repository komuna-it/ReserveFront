import { Component, signal } from '@angular/core';
import { AuthService } from '../../auth/authService';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, TranslocoPipe],
  standalone: true,
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterPage {
  email = '';
  name = '';
  password = '';
  language = '';
  readonly errorString = signal<string>('');
  readonly registerSuccess = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private translocoService: TranslocoService,
  ) {}

  async register() {
    
  console.log('register page: transloco active language: ', this.translocoService.getActiveLang());

    console.log(
      'Attempting registration with email:',
      this.email,
      'and password:',
      this.password,
      'and name:',
      this.name, 'language: ',
      this.language
    );
    this.errorString.set('');
    this.authService.register(this.email, this.password, this.name, this.language).subscribe({
      next: () => {
        this.registerSuccess.set(true);
        console.log('Registration successful');
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
}
