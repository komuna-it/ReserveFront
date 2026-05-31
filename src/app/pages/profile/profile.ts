import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth'; // Twój bezpieczny serwis auth
import { User } from '../../model/user';
import { Organization } from '../../model/organization';
import { ReservationDto } from '../../model/reservationDto';
import { Room } from '../../model/room';

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

  // readonly userId = this.authService.getUserIdFromToken();
  readonly userId = '1';
  activeTab = signal<'reservations' | 'team'>('reservations');

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
  }

  fetchOrganizations() {
    this.organizations.set([]);
    const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });

    this.http
      .get<Organization[]>(`${this.apiUrl}/user/${this.userId}/organizations`, { headers: header })
      .subscribe({
        next: (data) => {
          this.organizations.set(data);
          console.log('Fetched organizations: ', data);
        },
        error: (e) => console.error('Failed to fetch organizations: ', e),
      });
  }

  fetchReservations() {
    console.log('inside fetchReservations, rooms length : ', this.rooms().length);
    if (this.rooms().length === 0) {
      console.error('No rooms available after fetch attempt. Cannot fetch reservations.');
      return;
    }

    this.reservationResponses.set([]);

    for (const room of this.rooms()) {
      const url = `${this.getReservationsByRoomEndpoint}/${room.id}`;
      console.log('fetching reservations with url: ', url);

      const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });

      this.http.get<ReservationDto[]>(url, { headers: header }).subscribe({
        next: (data) => {
          this.reservationResponses.update((prev) => [...prev, ...data]);
          console.log(`Received ${data.length} responses for room ${room.id}`);
        },
        error: (e) => console.error('Failed to download reservation responses from backend: ', e),
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
    return durationStr.replace('PT', '').replace('H', ' godz').replace('M', ' min');
  }

  deleteReservation(reservationId: number) {
    console.log(`Trying to delete reservation with id ${reservationId}`);
    // not implemented
    // const url = `${this.apiUrl}/reservation/${reservationId}`;
    // this.http.delete(url).subscribe({
    //   next: () => {
    //     console.log(`Deleted reservation with id ${reservationId}`);
    //     this.fetchReservations();
    //   },
    //   error: (e) => console.error('Failed to delete reservation: ', e),
    // });
  }

  deleteTeamMember(userId: number) {
    console.log(`Trying to delete team member with id ${userId}`);
    // not implemented
    // const url = `${this.apiUrl}/organization/${this.organization.id}/member/${userId}`;
    // this.http.delete(url).subscribe({
    //   next: () => {
    //     console.log(`Deleted team member with id ${userId}`);
    //     this.fetchOrganization();
    //   },
    //   error: (e) => console.error('Failed to delete team member: ', e),
    // });
  }
}
