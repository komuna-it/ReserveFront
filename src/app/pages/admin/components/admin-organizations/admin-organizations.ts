import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../auth/authService';

@Component({
  selector: 'app-admin-organizations',
  imports: [],
  templateUrl: './admin-organizations.html',
  styleUrl: './admin-organizations.css',
})
export class AdminOrganizations {
  readonly authService = inject(AuthService);

  constructor() {
    this.authService.checkCurrentSession().subscribe();
  }
}
