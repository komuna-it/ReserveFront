import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { User } from '../../model/user';
import { Organization } from '../../model/organization';
import { ReservationDto } from '../../model/reservationDto';
import { Room } from '../../model/room';
import { Tab } from '../../model/tab';
import { OrganizationFront } from '../../model/organizationFront';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = process.env['VSF_API_URL'] || '';
  readonly getReservationsByOrganizationEndpoint = `${this.apiUrl}/reservation/organization/`;
  readonly getOrganizationsEndpoint = `${this.apiUrl}/organizationUser/user/${this.authService.userId()}/allOrganizations`;
  readonly getFutureReservationsEndpoint = `${this.apiUrl}/reservation/future`;
  readonly getOrganizationMembersEndpoint = `${this.apiUrl}/organizationUser/organization/members/`;

  readonly userId = parseInt(this.authService.userId() || '-1');

  reservedByLabel(reservation: ReservationDto): string {
    const org = this.organizations().find((o) => o.id === reservation.behalfOf);
    return org ? `${org.name}` : `Nieznany`;
  }

  activeTab = signal<Tab>(new Tab(0, 'Moje rezerwacje', 'reservations', undefined));
  allTabs = signal<Tab[]>([]);
  activeOrgsUsers = computed(() => {
    const activeTab = this.activeTab();
    if (activeTab.type === 'organization' && activeTab.org) {
      return activeTab.org.users;
    }
    return [];
  });

  readonly organizations = signal<Organization[]>([]);
  readonly organizationFront = signal<OrganizationFront[]>([]);

  readonly reservationResponses = signal<ReservationDto[]>([]);

  ngOnInit() {
    this.fetchOrganizationsOfUser();
    this.buildOrganizationFront();
  }

  fetchOrganizationsOfUser() {
    this.organizations.set([]);
    const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });

    this.http
      .get<
        Organization[]
      >(`${this.apiUrl}/organizationUser/user/${this.userId}/allOrganizations`, { headers: header })
      .subscribe({
        next: (data) => {
          this.organizations.set([]);
          this.organizations.set(data);
          this.buildOrganizationFront();
        },
        error: (e) => console.error('Failed to fetch organizations: ', e),
      });
  }

  buildOrganizationFront() {
    this.organizationFront.set([]);
    for (const org of this.organizations()) {
      const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });
      this.http
        .get<User[]>(`${this.getOrganizationMembersEndpoint}${org.id}`, { headers: header })
        .subscribe({
          next: (data) => {
            this.organizationFront.update((prev) => [
              ...prev,
              { ...org, users: data, id: org.id, name: org.name, ownerId: org.ownerId },
            ]);
            this.fetchReservationsWhereUserBelongs();
            this.buildTabs();
          },
          error: (e) => console.error(`Failed to fetch members for organization ${org.name}: `, e),
        });
    }
  }

  fetchReservationsWhereUserBelongs() {
    this.reservationResponses.set([]);
    console.log('Fetching reservations for organizations: ', this.organizationFront());
    const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });
    for (const org of this.organizationFront()) {
      const url = `${this.getReservationsByOrganizationEndpoint}${org.id}`;
      this.http.get<ReservationDto[]>(url, { headers: header }).subscribe({
        next: (data) => {
          this.reservationResponses.update((prev) => [...prev, ...data]);
          console.log(`Fetched reservations for organization ${org.name}: `, data);
        },
        error: (e) =>
          console.error(`Failed to download reservations for organization ${org.name}: `, e),
      });
    }
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  formatDuration(durationStr: string): string {
    return durationStr.replace('PT', '').replace('H', ' godz ').replace('M', ' min');
  }

  buildTabs() {
    this.allTabs.set([]);
    let id = 0;
    const reservationsTab = new Tab(id++, 'Moje rezerwacje', 'reservations', undefined);
    this.allTabs.update((prev) => [...prev, reservationsTab]);
    for (const org of this.organizationFront()) {
      const organizationTab = new Tab(id++, org.name, 'organization', org);
      this.allTabs.update((prev) => [...prev, organizationTab]);
    }
  }

  deleteReservation(reservationId: number) {
    console.log(`Trying to delete reservation with id ${reservationId}`);
  }

  deleteTeamMember(userId: number) {
    console.log(`Trying to delete team member with id ${userId}`);
  }
}
