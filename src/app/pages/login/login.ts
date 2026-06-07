import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
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
  errorMessage = '';
  isLoading = false;
  rememberMe = true;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  login() {
    this.errorMessage = '';
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
          this.errorMessage = 'Nieprawidłowy adres e-mail lub hasło';
        } else if (err.status === 0) {
          this.errorMessage = 'Brak połączenia z serwerem';
        } else {
          this.errorMessage =
            err.error?.message || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później';
        }

        console.error('Błąd logowania:', err);
      },
    });
  }
}
