import { Component } from '@angular/core';
import { AuthService } from '../../auth/authService';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterPage {
  email = '';
  name = '';
  password = '';
  errorMessage = '';
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async register() {
    console.log(
      'Attempting registration with email:',
      this.email,
      'and password:',
      this.password,
      'and name:',
      this.name,
    );
    this.errorMessage = '';
    try {
      const token = await this.authService.register(this.email, this.password, this.name);
      if (token) {
        console.log('Registration successful, received token:', token);
        this.router.navigate(['/']);
      }
    } catch (error: any) {
      console.log('Server error response:', error);

      if (error.error && error.error.message) {
        this.errorMessage = error.error.message;
      } else if (error.message) {
        this.errorMessage = error.message;
      } else {
        this.errorMessage = 'Błąd rejestracji';
      }
    }
  }
}
