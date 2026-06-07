import { Injectable, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth';
import { User } from '../model/user';
import { Organization } from '../model/organization';
import { ReservationDto } from '../model/reservationDto';
import { Room } from '../model/room';
import { Tab } from '../model/tab';
import { OrganizationFront } from '../model/organizationFront';
import { forkJoin, map } from 'rxjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ReservationWrapper } from '../model/reservationWrapper';
import { HourWrapper } from '../model/hourWrapper';
import { Router } from '@angular/router';

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
  private sseController: AbortController | null = null;
  private router = inject(Router);

  readonly rooms = signal<Room[]>([]);

  private apiUrl = process.env['VSF_API_URL'] || '';
  readonly getAllRoomsEndpoint = `${this.apiUrl}/room/all`;
  readonly getReservationsByRoomEndpoint = `${this.apiUrl}/reservation/room`;
  readonly getReservationsByOrganizationEndpoint = `${this.apiUrl}/reservation/organization/`;
  readonly getAllOrganizationsEndpoint = `${this.apiUrl}/organization/`;
  readonly getOrganizationsOfUserEndpoint = `${this.apiUrl}/organizationUser/user/${this.authService.userId()}/allOrganizations`;
  readonly getReservationsForAllUsersOrganizationsEndpoint = `${this.apiUrl}/reservation/user/${this.authService.userId()}/organizations`;
  readonly getFutureReservationsEndpoint = `${this.apiUrl}/reservation/future`;
  readonly getOrganizationMembersEndpoint = `${this.apiUrl}/organizationUser/organization/members/`;
  readonly createOrganizationEndpoint = `${this.apiUrl}/organization/`;
  readonly sseReservationEndpoint = `${this.apiUrl}/reservation/sse`;
  readonly postReservationEndpoint = `${this.apiUrl}/reservation`;

  readonly email = this.authService.email();

  readonly organizations = signal<Organization[]>([]);
  readonly organizationFront = signal<OrganizationFront[]>([]);
  readonly daySelectedByUser = signal<Date>(new Date());
  readonly currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));
  readonly currentMonthDate = signal<Date>(new Date());
  readonly displayBookingSuccesfulPopup = signal<boolean>(false);
  readonly displayBookingErrorPopup = signal<boolean>(false);
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
  readonly selectedBooking = signal<{
    date: string;
    hour: number;
    roomId: number;
    duration: number;
    roomName: string | undefined;
    organizationId: number;
    reservedByUserId: number;
  } | null>(null);

  checkIfReservationIdOverlapsWithDayAndRoom(reservationId: number): boolean {
    const day = this.daySelectedByUser();
    const roomId = this.selectedBooking()?.roomId;
    if (!roomId) return false;
    const reservations = this.reservations();
    const reservation = reservations.find((res) => res.id === reservationId);
    if (!reservation) return false;

    const reservationStartDate = new Date(reservation.startAt);
    const isSameDay =
      reservationStartDate.getFullYear() === day.getFullYear() &&
      reservationStartDate.getMonth() === day.getMonth() &&
      reservationStartDate.getDate() === day.getDate();
    const isSameRoom = reservation.roomId === roomId;

    return isSameDay && isSameRoom;
  }
  handleBookingClick(hour: number, roomId: number) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const day = this.daySelectedByUser();
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dateStr = String(day.getDate()).padStart(2, '0');

    this.selectedBooking.set({
      date: `${year}-${month}-${dateStr}`,
      hour: hour,
      roomId: roomId,
      duration: 1,
      roomName: this.rooms().find((r) => r.id === roomId)?.name,
      organizationId: this.organizations()[0]?.id || 0,
      reservedByUserId: parseInt(this.authService.userId() || '0', 0),
    });
  }

  public getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
  }
  readonly organizationsMap = computed(() => {
    const map = new Map<number, string>();
    for (const org of this.organizations()) {
      map.set(org.id, org.name);
    }
    return map;
  });
  selectDay(day: Date) {
    this.daySelectedByUser.set(day);
    this.currentWeekStart.set(this.getStartOfWeek(day));
    this.currentMonthDate.set(new Date(day.getFullYear(), day.getMonth(), 1));
  }

  readonly currentDayReservations = computed(() => {
    const selectedDate = this.daySelectedByUser();
    return this.reservations().filter((res) => this.isSameDay(new Date(res.startAt), selectedDate));
  });
  isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }
  navigateWeek(direction: 'prev' | 'next') {
    const current = new Date(this.currentWeekStart());
    current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    this.currentWeekStart.set(current);
    this.daySelectedByUser.set(current);
  }

  navigateMonth(direction: 'prev' | 'next') {
    const d = new Date(this.currentMonthDate());
    d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
    this.currentMonthDate.set(d);
  }
  readonly tableRows = computed(() => {
    const isAdmin = this.authService.isAdmin();
    const selectedDate = this.daySelectedByUser();
    const reservationsToday = this.currentDayReservations();
    const roomsList = this.rooms();
    const orgsMap = this.organizationsMap();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfSelected = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    );

    const isPastDay = startOfSelected < startOfToday;
    const isToday = startOfSelected.getTime() === startOfToday.getTime();
    const currentHour = now.getHours();

    return this.hoursRange.map((hour) => {
      const isPastHour = isPastDay || (isToday && hour <= currentHour);

      const cells = roomsList.map((room) => {
        const matchedReservation = reservationsToday.find((res) => {
          if (res.roomId !== room.id) return false;

          const startHour = new Date(res.startAt).getHours();
          const duration = this.parseDurationToHours(res.duration);
          return hour >= startHour && hour < startHour + duration;
        });

        const isReserved = !!matchedReservation;
        let isFirstHour = false;
        let isLastHour = false;
        let isReservedByMyOrg = false;
        let bandName = '';

        if (matchedReservation) {
          const startHour = new Date(matchedReservation.startAt).getHours();
          const duration = this.parseDurationToHours(matchedReservation.duration);

          isFirstHour = hour === startHour;
          isLastHour = hour === startHour + duration - 1;

          if (matchedReservation.behalfOf) {
            bandName = orgsMap.get(matchedReservation.behalfOf) || '';
            isReservedByMyOrg = orgsMap.has(matchedReservation.behalfOf);
          }
        }

        const hourWrapper = new HourWrapper(
          hour,
          isReserved,
          isFirstHour,
          isLastHour,
          isAdmin ? false : isReservedByMyOrg,
          isPastHour,
          bandName,
        );

        return {
          roomId: room.id,
          hourWrapper: hourWrapper,
        };
      });

      return { hour, cells };
    });
  });

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
          this.fetchReservationsForAllOrgsOfUser();
        },
        error: (e) => console.error(`Failed to delete reservation with id ${reservationId}`, e),
      });
  }

  fetchReservationsForAllOrgsOfUser() {
    const orgsFront = this.organizationFront();
    if (orgsFront.length === 0) {
      this.reservations.set([]);
      return;
    }
    const reservations = this.http
      .get<ReservationDto[]>(`${this.getReservationsForAllUsersOrganizationsEndpoint}`, {
        headers: this.authHeader,
      })
      .subscribe({
        next: (allReservationsArrays) => {
          let allData = allReservationsArrays.flat();

          allData = Array.from(new Map(allData.map((res) => [res.id, res])).values());
          console.log('fetchReservationsWhereUserBelongs: ' + reservations);
          const now = new Date();
          now.setHours(0, 0, 0, 0);

          allData = allData.filter((res) => res.startAt > now.toISOString());
          allData.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
          console.log('setting reservations, length: ' + this.reservations().length);
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
    this.reservations.set([]);
    for (const room of this.rooms()) {
      this.http
        .get<
          ReservationDto[]
        >(`${this.getReservationsByRoomEndpoint}/${room.id}`, { headers: this.authHeader })
        .subscribe({
          next: (data) => {
            console.log(`Reservations for room ${room.id}: `, data);
            this.reservations.update((res) => [...res, ...data]);
            console.log('setting reservations, length: ' + this.reservations().length);
          },
          error: (e) => console.error(`Failed to download reservations for room ${room.id}: `, e),
        });
    }
  }

  fetchPrivateReservationsOfUser() {}
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
      .get<Organization[]>(this.getOrganizationsOfUserEndpoint, { headers: this.authHeader })
      .subscribe({
        next: (data) => {
          this.organizations.set(data);
          console.log('Fetched organizations: ', data);
        },
        error: (e) => console.error('Failed to fetch organizations: ', e),
      });
  }

  fetchAllOrganizations() {
    this.http
      .get<Organization[]>(this.getAllOrganizationsEndpoint, { headers: this.authHeader })
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

  resetState() {
    this.rooms.set([]);
    this.organizations.set([]);
    this.organizationFront.set([]);
    this.reservations.set([]);
  }

  connectToReservationStream() {
    this.sseController = new AbortController();
    console.log('Connected to SSE for reservations');

    fetchEventSource(this.sseReservationEndpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.authService.accessToken()}`,
      },
      signal: this.sseController.signal,
      onmessage: (msg) => {
        if (msg.event === 'RESERVATION_CREATED') {
          console.group('=== SSE: WYKRYTO NOWĄ REZERWACJĘ ===');

          const msgData = JSON.parse(msg.data);
          const newReservationId = msgData.id;
          this.handleSse(newReservationId, msg.event);
        } else if (msg.event === 'RESERVATION_REMOVED') {
          console.log('SSE: RESERVATION_REMOVED event received, refreshing reservations list...');
          this.handleSse(0, msg.event);
        }
      },
      onerror: (err) => console.error('SSE: error:', err),
    });
  }

  handleSse(newReservationId: number | undefined, event: string) {
    if (event === 'RESERVATION_CREATED') {
      const myBooking = this.selectedBooking();

      if (!myBooking) {
        this.fetchAllReservations();
        console.groupEnd();
        return;
      }

      setTimeout(() => {
        const header = new HttpHeaders({
          Authorization: `Bearer ${this.authService.accessToken()}`,
        });

        this.http
          .get<ReservationDto[]>(this.getFutureReservationsEndpoint, { headers: header })
          .subscribe({
            next: (data) => {
              this.reservations.set(data);

              const newRes = data.find((r) => r.id === newReservationId);
              if (!newRes) {
                console.warn(
                  `Nie znaleziono rezerwacji o ID ${newReservationId} na pobranej liście!`,
                );
                return;
              }

              const resStart = new Date(newRes.startAt);
              const day = this.daySelectedByUser();
              const isSameDay =
                resStart.getFullYear() === day.getFullYear() &&
                resStart.getMonth() === day.getMonth() &&
                resStart.getDate() === day.getDate();

              const isSameRoom = newRes.roomId === myBooking.roomId;

              const newResStartHour = resStart.getHours();
              const newResDuration = this.parseDurationToHours(newRes.duration);
              const newResEndHour = newResStartHour + newResDuration;

              const myStartHour = myBooking.hour;
              const myEndHour = myStartHour + myBooking.duration;

              const isTimeOverlapping = newResStartHour < myEndHour && newResEndHour > myStartHour;
              const overlaps = isSameDay && isSameRoom && isTimeOverlapping;

              let userFromBookingStr = '';
              if (newRes.reservedBy && typeof newRes.reservedBy === 'object') {
                userFromBookingStr = String((newRes.reservedBy as any).id || '');
              } else {
                userFromBookingStr = String(newRes.reservedBy || '');
              }
              const userInSessionStr = String(this.authService.userId() || '');
              const isDifferentUser = userInSessionStr !== userFromBookingStr;

              if (overlaps && isDifferentUser) {
                this.selectedBooking.set(null);
                this.displayBookingSuccesfulPopup.set(false);
                this.displayBookingErrorPopup.set(true);
              }
            },
            error: (e) => console.error('Błąd pobierania rezerwacji w locie SSE:', e),
          });
      }, 300);
    } else if (event === 'RESERVATION_REMOVED') {
      this.fetchAllReservations();
    }
  }

  confirmBooking() {
    const booking = this.selectedBooking();
    if (!booking) return;

    const payload = {
      id: null,
      behalfOf: booking.organizationId,
      roomId: booking.roomId,
      startAt: `${booking.date}T${String(booking.hour).padStart(2, '0')}:00:00`,
      duration: `PT${booking.duration}H`,
      reservedBy: this.authService.userId(),
    };
    const header = new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });

    this.http
      .post<ReservationDto>(this.postReservationEndpoint, payload, { headers: header })
      .subscribe({
        next: (response) => {
          this.reservations.update((prev) => [...prev, response]);
          this.displayBookingSuccesfulPopup.set(true);
          this.selectedBooking.set(null);
        },
        error: (e) => console.error('Failed to create reservation: ', e),
      });
  }

  handleAdminReservationClick(hour: number, roomId: number) {
    console.log(`Clicked on hour ${hour} for room ${roomId}`);
  }
}
