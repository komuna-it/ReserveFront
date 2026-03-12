import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginPage {
constructor(private auth: AuthService) {}

  email = '';
  password = '';

  login() {
      this.auth.login(this.email, this.password);

    console.log('Login attempt');
    console.log('email:', this.email);
    console.log('Password:', this.password);

    if (this.email === 'admin' && this.password === 'admin') {
      alert('Login successful');
    } else {
      alert('Invalid credentials');
    }
  }

}