import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../../services/auth';
import { User } from '../../../../model/user';
import { Organization } from '../../../../model/organization';
import { ReservationDto } from '../../../../model/reservationDto';
import { Room } from '../../../../model/room';
import { Tab } from '../../../../model/tab';
import { OrganizationFront } from '../../../../model/organizationFront';
import { forkJoin, map } from 'rxjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Utils } from '../../../../services/utils/utils';
import { HourWrapper } from '../../../../model/hourWrapper';

@Component({
  selector: 'app-admin-calendar',
  imports: [CommonModule],
  templateUrl: './admin-calendar.html',
  styleUrl: './admin-calendar.css',
})
export class AdminCalendar {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  readonly userId = parseInt(this.authService.userId() || '-1');
  readonly email = this.authService.email();
  private sseController: AbortController | null = null;
  readonly utils = inject(Utils);
  readonly currentMonthLabel = this.utils.currentMonthLabel();

  readonly hoursRange = this.utils.hoursRange;
  readonly durationOptions = this.utils.durationOptions;
  readonly monthLabels = this.utils.monthLabels;
  readonly weekDayLabels = this.utils.weekDayLabels;

  readonly reservations = signal<ReservationDto[]>([]);
  readonly organizations = signal<Organization[]>([]);
  readonly reservationResponses = signal<ReservationDto[]>([]);
  readonly daySelectedByUser = signal<Date>(new Date());
  readonly currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));
  readonly currentMonthDate = signal<Date>(new Date());

  private getStartOfWeek(date: Date): Date {
    return this.utils.getStartOfWeek(date);
  }
  isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }
  readonly weekDays = computed(() => {
    return this.utils.weekDays();
  });

  selectDay(day: Date) {
    this.daySelectedByUser.set(day);
    this.currentWeekStart.set(this.getStartOfWeek(day));
    this.currentMonthDate.set(new Date(day.getFullYear(), day.getMonth(), 1));
  }

  deleteReservation(reservationId: number) {
    this.utils.deleteReservation(reservationId);
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
  ngOnInit() {
    this.utils.fetchRoomsAndReservations();
  }

  readonly tableRows = computed(() => {
    const selectedDate = this.daySelectedByUser();
    const reservations = this.utils.reservations();
    const roomsList = this.utils.rooms();
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfSelected = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    );
    const isPastDay = startOfSelected < startOfToday;
    const isToday = startOfSelected.getTime() === startOfToday.getTime();

    return this.hoursRange.map((hour) => {
      const cells = roomsList.map((room) => {
        const isPastHour = isPastDay || (isToday && hour <= now.getHours());

        const matchedReservation = reservations.find((res) => {
          if (res.roomId !== room.id) return false;
          const resStart = new Date(res.startAt);

          const isSameDay =
            resStart.getFullYear() === selectedDate.getFullYear() &&
            resStart.getMonth() === selectedDate.getMonth() &&
            resStart.getDate() === selectedDate.getDate();

          if (!isSameDay) return false;

          const startHour = resStart.getHours();
          const duration = this.parseDurationToHours(res.duration);
          return hour >= startHour && hour < startHour + duration;
        });

        const isReserved = !!matchedReservation;
        const isDisabled = isReserved || isPastHour;

        let isFirstHour = false;
        let isLastHour = false;
        let isReservedByMyOrganization = false;
        let bandName = '';

        for (const org of this.utils.organizations()) {
          for (const res of this.utils.reservations()) {
            if (org.id === res.behalfOf) {
              bandName = org.name;
              console.log('band found: ' + bandName);
            }
          }
        }

        if (matchedReservation) {
          const resStart = new Date(matchedReservation.startAt);
          const startHour = resStart.getHours();
          const duration = this.parseDurationToHours(matchedReservation.duration);

          isFirstHour = hour === startHour;
          isLastHour = hour === startHour + duration - 1;

          const matchingTeam = this.utils
            .organizations()
            .find((t) => t.id === matchedReservation.behalfOf);
          if (matchingTeam) {
            isReservedByMyOrganization = true;
            bandName = matchingTeam.name;
          }
        }

        const hourWrapper = new HourWrapper(
          hour,
          isDisabled,
          isFirstHour,
          isLastHour,
          isReservedByMyOrganization,
        );

        (hourWrapper as any).bandName = bandName;
        if (hourWrapper.isReserved) {
          console.log(`Reserved hour:`, hourWrapper);
        }
        console.log('organizations: ' + this.utils.organizations());
        return {
          roomId: room.id,
          hourWrapper: hourWrapper,
        };
      });

      return { hour, cells };
    });
  });

  private parseDurationToHours(isoDuration: string): number {
    return this.utils.parseDurationToHours(isoDuration);
  }

  handleReservationClick(hour: number, roomId: number) {
    console.log(`Clicked on hour ${hour} for room ${roomId}`);
  }
}
