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

  username = '';
  password = '';

  login() {
      const user = { id: 1, email: 'test@example.com', name: 'Vlad' };
      this.auth.login(user);

    console.log('Login attempt');
    console.log('Username:', this.username);
    console.log('Password:', this.password);

    if (this.username === 'admin' && this.password === 'admin') {
      alert('Login successful');
    } else {
      alert('Invalid credentials');
    }
  }

}