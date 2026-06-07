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
import { forkJoin, map } from 'rxjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ReservationWrapper } from '../../model/reservationWrapper';
import { Utils } from '../../services/utils';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit {
  private http = inject(HttpClient);
  readonly authService = inject(AuthService);
  readonly utils = inject(Utils);
  private apiUrl = process.env['VSF_API_URL'] || '';
  readonly getReservationsByOrganizationEndpoint = `${this.apiUrl}/reservation/organization/`;
  readonly getOrganizationsEndpoint = `${this.apiUrl}/organizationUser/user/${this.authService.userId()}/allOrganizations`;
  readonly getFutureReservationsEndpoint = `${this.apiUrl}/reservation/future`;
  readonly getOrganizationMembersEndpoint = `${this.apiUrl}/organizationUser/organization/members/`;
  readonly getOrganizationsOfUserEndpoint = `${this.apiUrl}/organizationUser/user`;
  readonly createOrganizationEndpoint = `${this.apiUrl}/organization/`;
  readonly sseReservationEndpoint = `${this.apiUrl}/reservation/sse`;
  readonly email = this.authService.email();
  readonly reservationToDelete = signal<ReservationDto | null>(null);

  private sseController: AbortController | null = null;

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
  readonly areYouSure = signal<boolean>(false);

  ngOnInit() {
    this.fetchOrganizationsOfUser();
  }

  handleDeleteReservationClick(reservation: ReservationDto) {
    console.log('clicked remove reservationId: ' + reservation);
    this.reservationToDelete.set(reservation);
    this.areYouSure.set(true);
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
    const orgs = this.organizations();
    if (orgs.length === 0) {
      this.organizationFront.set([]);
      this.buildTabs();
      this.fetchReservationsWhereUserBelongs();
      return;
    }

    const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });

    const requests = orgs.map((org) =>
      this.http
        .get<User[]>(`${this.getOrganizationMembersEndpoint}${org.id}`, { headers: header })
        .pipe(
          map((users) => {
            const owner = users.find((user) => user.id === org.ownerId) || null;

            return {
              id: org.id,
              name: org.name,
              ownerId: org.ownerId,
              owner: owner,
              users: users,
            } as OrganizationFront;
          }),
        ),
    );
    forkJoin(requests).subscribe({
      next: (completedOrgsFront) => {
        this.organizationFront.set(completedOrgsFront);

        this.fetchReservationsWhereUserBelongs();
        this.buildTabs();
      },
      error: (e) => console.error('Failed to fetch members for organizations: ', e),
    });
  }
  fetchReservationsWhereUserBelongs() {
    const orgsFront = this.organizationFront();
    if (orgsFront.length === 0) {
      this.reservationResponses.set([]);
      return;
    }

    const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });
    const requests = orgsFront.map((org) =>
      this.http.get<ReservationDto[]>(`${this.getReservationsByOrganizationEndpoint}${org.id}`, {
        headers: header,
      }),
    );

    forkJoin(requests).subscribe({
      next: (allReservationsArrays) => {
        let allData = allReservationsArrays.flat();

        allData = Array.from(new Map(allData.map((res) => [res.id, res])).values());

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        allData = allData.filter((res) => res.startAt > now.toISOString());
        allData.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

        this.reservationResponses.set(allData);
      },
      error: (e) => console.error(`Failed to download reservations`, e),
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

  buildTabs() {
    let id = 0;
    const newTabs: Tab[] = [];

    newTabs.push(new Tab(id++, 'Moje rezerwacje', 'reservations', undefined));

    for (const org of this.organizationFront()) {
      newTabs.push(new Tab(id++, org.name, 'organization', org));
    }
    newTabs.push(new Tab(id++, 'Utwórz zespół', 'createorganization', undefined));

    this.allTabs.set(newTabs);
  }
  deleteReservation(reservationId: number) {
    console.log(`Trying to delete reservation with id ${reservationId}`);
    this.http
      .delete(`${this.apiUrl}/reservation/${reservationId}`, {
        headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` }),
      })
      .subscribe({
        next: () => {
          console.log(`Successfully deleted reservation with id ${reservationId}`);
          this.fetchReservationsWhereUserBelongs();
          this.areYouSure.set(false);
        },
        error: (e) => console.error(`Failed to delete reservation with id ${reservationId}`, e),
      });
  }

  deleteTeamMember(userId: number) {
    console.log(`Trying to delete team member with id ${userId}`);
  }

  readonly clickedCreateTeam = signal(false);
  handleClickCreateTeam() {
    this.clickedCreateTeam.set(true);
  }

  createOrganization(event: Event, name: string) {
    event.preventDefault();

    if (!name.trim()) return;

    this.http
      .post(
        this.createOrganizationEndpoint,
        { name },
        {
          headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` }),
        },
      )
      .subscribe({
        next: () => {
          console.log(`Successfully created organization with name ${name}`);
          this.fetchOrganizationsOfUser();
        },
        error: (e) => console.error(`Failed to create organization with name ${name}`, e),
      });
  }

  private connectToReservationStream() {
    this.sseController = new AbortController();
    console.log('Connected to SSE for reservations');
    fetchEventSource(this.sseReservationEndpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.authService.accessToken()}`,
      },
      signal: this.sseController.signal,
      onmessage: (msg) => {
        console.log('Received SSE message: ', msg);
        if (msg.event === 'RESERVATION_CREATED') {
          console.log('Wykryto nową rezerwację przez SSE, odświeżam listę...');
          this.fetchReservationsWhereUserBelongs();
        } else if (msg.event === 'RESERVATION_REMOVED') {
          console.log('Wykryto usuniętą rezerwację przez SSE, odświeżam listę...');
          this.fetchReservationsWhereUserBelongs();
        }
      },
      onerror: (err) => {
        console.error('SSE error:', err);
      },
    });
  }
  ngOnDestroy() {
    if (this.sseController) {
      this.sseController.abort();
    }
  }
}
