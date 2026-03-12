import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterPage {

  constructor( private auth: AuthService) {}

  email = '';
  password = '';

  register() {
    this.auth.register(this.email, this.password);
  }

}
