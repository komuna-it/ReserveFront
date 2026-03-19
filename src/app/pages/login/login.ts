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
  styleUrls: ['./login.css']
})
export class LoginPage {
  constructor(private authService: AuthService, private router: Router) {}

  email = '';
  password = '';
  errorMessage = '';

  async login() {
    this.errorMessage = ''; // clear previous error
    try {
      const user = await this.authService.login(this.email, this.password);
      if (user) {
        this.router.navigate(['/']);
      }
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Błąd logowania';
    }
  }
}