import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
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

  constructor(private authService: AuthService, private router: Router) {}

  email = '';
  password = '';
  errorMessage = '';


async register() {
  this.errorMessage = '';
    try {
      const user = await this.authService.register(this.email, this.password);
      if (user) {
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
