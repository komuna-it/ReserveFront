import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { User } from '../../model/user';
import { Organization } from '../../model/organization';
import { ReservationDto } from '../../model/reservationDto';
import { Room } from '../../model/room';
import { Tab } from '../../model/tab';

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
  readonly getReservationsByRoomEndpoint = `${this.apiUrl}/reservation/room`;
  readonly getOrganizationsEndpoint = `${this.apiUrl}/organizationUser/user/${this.authService.userId()}/allOrganizations`;
  readonly getFutureReservationsEndpoint = `${this.apiUrl}/reservation/future`;

  readonly userId = parseInt(this.authService.userId() || '-1');

  activeTab = signal<Tab>(new Tab(0, 'Moje rezerwacje', 'reservations', undefined, undefined));
  allTabs = signal<Tab[]>([]);

  readonly teamTab = new Tab(-1, 'team', 'Mój Zespół', undefined, undefined);

  readonly user1 = new User(1, 'email1@email.com', 'username1');
  readonly user2 = new User(2, 'email2@email.com', 'username2');
  readonly user3 = new User(3, 'email3@email.com', 'username3');
  readonly users = [this.user1, this.user2, this.user3];
  readonly organization = new Organization(1, 'ZESPÓŁ', this.users);
  readonly organizations = signal<Organization[]>([]);

  readonly rooms = signal<Room[]>([
    { id: 1, name: 'Sala Konferencyjna A' },
    { id: 2, name: 'Studio Nagrań B' },
  ]);

  readonly reservationResponses = signal<ReservationDto[]>([]);

  readonly filteredReservations = computed(() => {
    return this.reservationResponses().filter((res) => res.behalfOf === this.organization.id);
  });

  ngOnInit() {
    this.fetchReservations();
    this.fetchOrganizations();
    this.fetchTabs();
  }

  fetchOrganizations() {
    this.organizations.set([]);
    const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });

    this.http
      .get<
        Organization[]
      >(`${this.apiUrl}/organizationUser/user/${this.userId}/allOrganizations`, { headers: header })
      .subscribe({
        next: (data) => {
          this.organizations.set(data);
          console.log('Fetched organizations: ', data);
        },
        error: (e) => console.error('Failed to fetch organizations: ', e),
      });
  }

  fetchReservations() {
    if (this.rooms().length === 0) {
      console.error('No rooms available after fetch attempt. Cannot fetch reservations.');
      return;
    }

    this.reservationResponses.set([]);

    const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });

    this.reservationResponses.set([]);
    const url = `${this.getFutureReservationsEndpoint}`;
    this.http.get<ReservationDto[]>(url, { headers: header }).subscribe({
      next: (data) => {
        this.reservationResponses.update((prev) => [...prev, ...data]);
        console.log(`Fetched reservations: `, data);
      },
      error: (e) => console.error('Failed to download reservations: ', e),
    });
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

  fetchTabs() {
    const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });

    this.http.get<Organization[]>(this.getOrganizationsEndpoint, { headers: header }).subscribe({
      next: (data) => {
        this.organizations.set(data);
        let id = 0;
        const reservationTab = new Tab(
          ++id,
          'Moje rezerwacje',
          'reservations',
          undefined,
          undefined,
        );

        const organizationTabs = data.map(
          (org) => new Tab(++id, org.name, 'organization', org.name, org.id),
        );
        console.log('Fetched organizations for tabs: ', data);
        this.allTabs.set([reservationTab, ...organizationTabs]);
        console.log('Constructed tabs: ', this.allTabs());
      },
      error: (e) => console.error('Failed to fetch organizations for tabs: ', e),
    });
  }

  deleteReservation(reservationId: number) {
    console.log(`Trying to delete reservation with id ${reservationId}`);
  }

  deleteTeamMember(userId: number) {
    console.log(`Trying to delete team member with id ${userId}`);
  }
}
