import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/authService';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginPage {
  email = '';
  password = '';
  isLoading = false;
  rememberMe = true;
  readonly errorString = signal<string>('');

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  login() {
    this.isLoading = true;
    console.log(
      'Attempting login with email:',
      this.email,
      'and password:',
      this.password,
      ', rememberMe:',
      this.rememberMe,
    );
    this.authService.login(this.email, this.password, this.rememberMe).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
        console.log('Login successful, navigating to home page');
      },

      error: (err) => {
        this.isLoading = false;

        if (err.status === 401 || err.status === 403) {
          // this.errorString.set('Nieprawidłowy adres e-mail lub hasło');
          this.errorString.set(
            err.error?.message || 'Nieprawidłowy adres e-mail / hasło lub konto nieaktywne',
          );
        } else if (err.status === 0) {
          this.errorString.set('Brak połączenia z serwerem');
        } else {
          this.errorString.set(
            err.errorString?.message || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później',
          );
        }

        console.error('Błąd logowania:', err);
      },
    });
  }
}
