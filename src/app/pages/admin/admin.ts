import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/authService';
import { OrganizationList } from './components/organization-list/organization-list';
import { ReservationStore } from '../../components/reservation/reservation.store';
@Component({
  selector: 'app-admin',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminPage {
  readonly store = inject(ReservationStore);

  handleAddOrganization() {
    this.store.isAdminAddOrganizationActive.set(true);
  }
}
