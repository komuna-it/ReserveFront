import { Injectable, inject, signal, computed, OnInit } from '@angular/core';
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

@Injectable({
  providedIn: 'root',
})
export class Utils {
  constructor() {
    this.fetchRoomsAndReservations();
    this.fetchOrganizationsOfUser();
    this.fetchAllOrganizations();
  }
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  readonly rooms = signal<Room[]>([]);

  private apiUrl = process.env['VSF_API_URL'] || '';
  readonly getAllRoomsEndpoint = `${this.apiUrl}/room/all`;
  readonly getReservationsByRoomEndpoint = `${this.apiUrl}/reservation/room`;
  readonly getReservationsByOrganizationEndpoint = `${this.apiUrl}/reservation/organization/`;
  readonly getOrganizationsEndpoint = `${this.apiUrl}/organizationUser/user/${this.authService.userId()}/allOrganizations`;
  readonly getFutureReservationsEndpoint = `${this.apiUrl}/reservation/future`;
  readonly getOrganizationMembersEndpoint = `${this.apiUrl}/organizationUser/organization/members/`;
  readonly getOrganizationsOfUserEndpoint = `${this.apiUrl}/organizationUser/user`;
  readonly createOrganizationEndpoint = `${this.apiUrl}/organization/`;
  readonly sseReservationEndpoint = `${this.apiUrl}/reservation/sse`;
  readonly email = this.authService.email();

  readonly organizations = signal<Organization[]>([]);
  readonly organizationFront = signal<OrganizationFront[]>([]);
  readonly daySelectedByUser = signal<Date>(new Date());
  readonly currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));
  readonly currentMonthDate = signal<Date>(new Date());
  readonly accessToken = computed(() => this.authService.accessToken());

  readonly reservations = signal<ReservationDto[]>([]);
  readonly authHeader = new HttpHeaders({
    Authorization: `Bearer ${this.authService.accessToken()}`,
  });

  readonly hoursRange = Array.from({ length: 12 }, (_, i) => i + 10); // 10:00 - 21:00
  readonly durationOptions = Array.from({ length: 8 }, (_, i) => i + 1); // max 8 hs
  readonly monthLabels = [
    'Styczeń',
    'Luty',
    'Marzec',
    'Kwiecień',
    'Maj',
    'Czerwiec',
    'Lipiec',
    'Sierpień',
    'Wrzesień',
    'Październik',
    'Listopad',
    'Grudzień',
  ];
  readonly weekDayLabels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
  public getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
  }

  readonly currentWeekLabel = computed(() => {
    const start = this.currentWeekStart();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    if (start.getMonth() === end.getMonth()) {
      return `${this.monthLabels[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${this.monthLabels[start.getMonth()]} - ${this.monthLabels[end.getMonth()]} ${start.getFullYear()}`;
  });

  activeAdminTab = signal<Tab>(new Tab(0, 'Rezerwacje', 'reservations', undefined));
  allAdminTabs = signal<Tab[]>([]);

  generateDurationLabel(dateStartString: string, duration: string): string {
    const dateStart = new Date(dateStartString);
    const day = dateStart.getDay();
    const year = dateStart.getFullYear();
    const month = String(dateStart.getMonth() + 1).padStart(2, '0');
    const startAt = dateStart.getHours();
    const durationHours = this.parseDurationToHours(duration);
    const endAt = startAt + durationHours;
    return `${day}.${month}.${year} ${startAt}:00 - ${endAt}:00`;
  }
  generateDateLabel(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const startAt = date.getHours();
    return `${day}.${month}.${year} ${startAt}:00`;
  }

  readonly weekDays = computed(() => {
    const start = this.currentWeekStart();
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  });

  readonly monthGridDays = computed(() => {
    const viewDate = this.currentMonthDate();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    let startOffset = firstDayOfMonth.getDay();
    if (startOffset === 0) startOffset = 7;

    const startGridDate = new Date(firstDayOfMonth);
    startGridDate.setDate(firstDayOfMonth.getDate() - (startOffset - 1));

    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(startGridDate);
      day.setDate(startGridDate.getDate() + i);
      return day;
    });
  });

  readonly currentMonthLabel = computed(() => {
    const date = this.currentMonthDate();
    return `${this.monthLabels[date.getMonth()]} ${date.getFullYear()}`;
  });

  deleteReservation(reservationId: number) {
    console.log(`Trying to delete reservation with id ${reservationId}`);
    this.http
      .delete(`${this.apiUrl}/reservation/${reservationId}`, {
        headers: this.authHeader,
      })
      .subscribe({
        next: () => {
          console.log(`Successfully deleted reservation with id ${reservationId}`);
          this.fetchReservationsWhereUserBelongs();
        },
        error: (e) => console.error(`Failed to delete reservation with id ${reservationId}`, e),
      });
  }

  fetchReservationsWhereUserBelongs() {
    const orgsFront = this.organizationFront();
    if (orgsFront.length === 0) {
      this.reservations.set([]);
      return;
    }
    const requests = orgsFront.map((org) =>
      this.http.get<ReservationDto[]>(`${this.getReservationsByOrganizationEndpoint}${org.id}`, {
        headers: this.authHeader,
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

        this.reservations.set(allData);
      },
      error: (e) => console.error(`Failed to download reservations`, e),
    });
  }

  public parseDurationToHours(isoDuration: string): number {
    const hoursMatch = isoDuration.match(/(\d+)H/);
    return hoursMatch ? parseInt(hoursMatch[1], 10) : 1;
  }

  fetchAllReservations() {
    for (const room of this.rooms()) {
      this.http
        .get<
          ReservationDto[]
        >(`${this.getReservationsByRoomEndpoint}/${room.id}`, { headers: this.authHeader })
        .subscribe({
          next: (data) => {
            console.log(`Reservations for room ${room.id}: `, data);
            this.reservations.update((res) => [...res, ...data]);
          },
          error: (e) => console.error(`Failed to download reservations for room ${room.id}: `, e),
        });
    }
  }

  fetchRoomsAndReservations() {
    this.http.get<Room[]>(this.getAllRoomsEndpoint, { headers: this.authHeader }).subscribe({
      next: (data) => {
        console.log('Rooms downloaded: ', data);
        this.rooms.set(data);
        this.fetchAllReservations();
      },
      error: (e) => console.error('Failed to download rooms: ', e),
    });
  }
  fetchOrganizationsOfUser() {
    this.http
      .get<Organization[]>(this.getOrganizationsEndpoint, { headers: this.authHeader })
      .subscribe({
        next: (data) => {
          this.organizations.set(data);
          console.log('Fetched organizations: ', data);
        },
        error: (e) => console.error('Failed to fetch organizations: ', e),
      });
  }

  // to update
  fetchAllOrganizations() {
    this.http
      .get<Organization[]>(this.getOrganizationsEndpoint, { headers: this.authHeader })
      .subscribe({
        next: (data) => {
          this.organizations.set(data);
          console.log('Fetched organizations: ', data);
        },
        error: (e) => console.error('Failed to fetch organizations: ', e),
      });
  }

  convertToReservationWrapper(
    reservationDto: ReservationDto,
    room: Room,
    user: User,
    organization: Organization | null,
  ): ReservationWrapper {
    const durationLabel = this.generateDurationLabel(
      reservationDto.startAt,
      reservationDto.duration,
    );
    console.log('durationLabel :' + durationLabel);
    const wrapper = new ReservationWrapper(
      user.id,
      user.email,
      room.id,
      room.name,
      this.generateDateLabel(reservationDto.startAt),
      reservationDto.duration,
      reservationDto.id || null,
      reservationDto.behalfOf || null,
      organization?.name || null,
    );
    wrapper.durationLabel = durationLabel;
    console.log('wrapper: ' + wrapper);
    return wrapper;
  }
}
