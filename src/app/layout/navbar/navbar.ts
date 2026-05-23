import { signal, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, AuthResponse } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar {
  authService = inject(AuthService);
  readonly isLoggedIn = this.authService.isLoggedIn;
}
