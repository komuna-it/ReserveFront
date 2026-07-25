import { computed, inject, Injectable, signal } from '@angular/core';
import { CalendarHelper } from '../calendar/calendar.helper';
import { OrganizationFront } from '../../model/organizationFront';
import { HourWrapper } from '../../model/hourWrapper';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth/authService';
import { Room } from '../../model/room';
import { ReservationDto } from '../../model/reservationDto';
import { Organization } from '../../model/organization';
import { max } from 'rxjs';
import { User } from '../../model/user';

@Injectable({ providedIn: 'root' })
export class ReservationStore {
  private helper = inject(CalendarHelper);
  private authService = inject(AuthService);

  readonly rooms = signal<Room[]>([]);
  readonly reservations = signal<ReservationDto[]>([]);
  readonly userOrganizations = signal<Organization[]>([]);
  readonly allOrganizations = signal<Organization[]>([]);
  readonly orgAndMembersMap = signal<Map<Organization, User[]>>(new Map());
  readonly daySelectedByUser = signal<Date>(new Date());
  readonly currentWeekStart = signal<Date>(this.helper.getStartOfWeek(new Date()));
  readonly currentMonthDate = signal<Date>(new Date());
  readonly testText = signal<string>('');

  readonly durationOptions = computed(() => {
    const booking = this.selectedBooking();
    if (!booking) return [];

    const reservs = this.currentDayReservations();
    const reservsForRoom = reservs.filter((res) => res.roomId === booking?.roomId);
    const bookingStartHour = booking?.hour;
    let limitHour = 22;

    for (const res of reservsForRoom) {
      const resStartHour = new Date(res.startAt).getHours();

      if (resStartHour < limitHour && resStartHour > bookingStartHour) {
        limitHour = resStartHour;
      }
    }

    const maxDuration = limitHour - bookingStartHour;
    console.log('max duration: ', maxDuration);
    return Array.from({ length: Math.max(0, maxDuration) }, (_, i) => i + 1);
  });

  readonly displayBookingSuccesfulPopup = signal<boolean>(false);
  readonly displayBookingErrorPopup = signal<boolean>(false);

  readonly selectedBooking = signal<{
    date: string;
    hour: number;
    roomId: number;
    duration: number;
    roomName: string | undefined;
    organizationId: number;
    reservedByUserId: number;
  } | null>(null);

  readonly userOrgsMap = computed(
    () => new Map(this.userOrganizations().map((o) => [o.id, o.name])),
  );
  readonly allOrgsMap = computed(() => new Map(this.allOrganizations().map((o) => [o.id, o.name])));
  readonly teamsList = signal<OrganizationFront[]>([]);

  readonly currentDayReservations = computed(() => {
    const selectedDate = this.daySelectedByUser();
    return this.reservations().filter((res) =>
      this.helper.isSameDay(new Date(res.startAt), selectedDate),
    );
  });

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
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    let offset = firstDay.getDay();
    if (offset === 0) offset = 7;

    const startGrid = new Date(firstDay);
    startGrid.setDate(firstDay.getDate() - (offset - 1));

    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(startGrid);
      day.setDate(startGrid.getDate() + i);
      return day;
    });
  });

  readonly currentMonthLabel = computed(
    () =>
      `${this.helper.monthLabels[this.currentMonthDate().getMonth()]} ${this.currentMonthDate().getFullYear()}`,
  );

  readonly currentWeekLabel = computed(() => {
    const start = this.currentWeekStart();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    if (start.getMonth() === end.getMonth()) {
      return `${this.helper.monthLabels[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${this.helper.monthLabels[start.getMonth()]} - ${this.helper.monthLabels[end.getMonth()]} ${start.getFullYear()}`;
  });

  readonly tableRows = computed(() => {
    const isAdmin = this.authService.isAdmin();
    const selectedDate = this.daySelectedByUser();
    const reservationsToday = this.currentDayReservations();
    const roomsList = this.rooms();
    const userOrgs = this.userOrgsMap();
    const allOrgs = this.allOrgsMap();
    const hoursRange = this.helper.hoursRange;

    const now = new Date();
    const isPastDay =
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) <
      new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isToday = this.helper.isSameDay(selectedDate, now);
    const currentHour = now.getHours();

    return hoursRange.map((hour) => {
      const isPastHour = isPastDay || (isToday && hour <= currentHour);

      const cells = roomsList.map((room) => {
        const matched = reservationsToday.find((res) => {
          if (res.roomId !== room.id) return false;
          const startHour = new Date(res.startAt).getHours();
          const duration = this.helper.parseDurationToHours(res.duration);
          return hour >= startHour && hour < startHour + duration;
        });

        const isReserved = !!matched;
        let isFirst = false;
        let isLast = false;
        let isMyOrg = false;
        let bandName = '';

        if (matched) {
          const startHour = new Date(matched.startAt).getHours();
          const duration = this.helper.parseDurationToHours(matched.duration);
          isFirst = hour === startHour;
          isLast = hour === startHour + duration - 1;

          if (matched.behalfOf) {
            if (isAdmin) {
              bandName = allOrgs.get(matched.behalfOf) || `Organizacja #${matched.behalfOf}`;
              isMyOrg = false;
            } else {
              if (userOrgs.has(matched.behalfOf)) {
                isMyOrg = true;
                bandName = userOrgs.get(matched.behalfOf) || '';
              } else {
                isMyOrg = false;
                bandName = '';
              }
            }
          }
        }

        return {
          roomId: room.id,
          hourWrapper: new HourWrapper(
            hour,
            isReserved,
            isFirst,
            isLast,
            isMyOrg,
            isPastHour,
            bandName,
          ),
        };
      });

      return { hour, cells };
    });
  });

  readonly isAdminAddOrganizationActive = signal<boolean>(false);
  readonly isAdminOrganizationActive = signal<boolean>(false);
}
