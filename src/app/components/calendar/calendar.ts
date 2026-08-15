import { Component, inject, computed, Signal, signal, effect } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { ReservationStore } from '../reservation/reservation.store';
import { ReservationFacade } from '../reservation/reservation.facade';
import { AuthService } from '../../auth/authService';

import { CalendarBookingModal } from '../modals/calendar-booking-modal/calendar-booking-modal';
import { CalendarHour } from '../calendar-hour/calendar-hour';
import { SuccessPopup } from '../../modals/success-popup/success-popup';
import { ErrorPopup } from '../../modals/error-popup/error-popup';

import { ReservationDto } from '../../model/reservationDto';
import { ReservationType } from '../../model/reservationType';
import { CalendarHelper } from './calendar.helper';
import { Booking } from '../../model/booking';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    DatePipe,
    TranslocoModule,
    CalendarHour,
    CalendarBookingModal,
    SuccessPopup,
    ErrorPopup,
  ],
  templateUrl: './calendar.html',
})
export class CalendarComponent {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly auth = inject(AuthService);
  readonly loco = inject(TranslocoService);
  public helper = inject(CalendarHelper);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly currentDate = new Date();

  readonly mobileSelectedRoom = signal<any | null>(null);
  readonly isMobileRoomMenuOpen = signal<boolean>(false);

  constructor() {
    const user = this.auth.currentUser();
    if (user) {
      if (this.auth.isAdmin()) {
        this.facade.getAllMembersAllOrganizations();
      } else {
        this.facade.getOrganizationsOfUser(false, user.id);
      }
    }
    this.facade.getFutureReservations();
    this.facade.getRooms();

    const params = this.route.snapshot.queryParams;
    if (params['date']) {
      const parsedDate = new Date(params['date']);
      if (!isNaN(parsedDate.getTime())) {
        this.facade.selectDay(parsedDate);
      }
    }

    effect(() => {
      const rooms = this.store.rooms();
      if (rooms && rooms.length > 0 && !this.mobileSelectedRoom()) {
        const queryParams = this.route.snapshot.queryParams;
        let roomToSelect = rooms[0];

        if (queryParams['roomId']) {
          const found = rooms.find((r: any) => String(r.id) === String(queryParams['roomId']));
          if (found) roomToSelect = found;
        }
        this.mobileSelectedRoom.set(roomToSelect);
      }
    });
  }

  readonly weekDayKeys: string[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  readonly hoursRange: number[] = Array.from({ length: 12 }, (_, i) => i + 10);

  readonly datesToDisplay: Signal<Date[]> = computed(() => {
    try {
      const baseDate = this.store.currentWeekStart();
      return this.getWeekDays(baseDate);
    } catch {
      return this.getWeekDays(new Date());
    }
  });

  get currentWeekInfo() {
    const baseDate = this.store.weekDays()[0];
    return this.helper.getWeekInfo(baseDate);
  }

  onDaySelect(day: Date): void {
    this.facade.selectDay(day);
    this.updateUrl(day, this.mobileSelectedRoom()?.id);
  }

  onRoomSelect(room: any): void {
    this.mobileSelectedRoom.set(room);
    this.isMobileRoomMenuOpen.set(false);
    this.updateUrl(this.store.daySelectedByUser(), room.id);
  }

  goToToday(): void {
    const today = new Date();
    this.onDaySelect(today);
  }

  private updateUrl(
    day: Date | null | undefined,
    roomId: string | number | null | undefined,
  ): void {
    const queryParams: any = {};

    if (day) {
      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const d = String(day.getDate()).padStart(2, '0');
      queryParams.date = `${year}-${month}-${d}`;
    }
    if (roomId) {
      queryParams.roomId = roomId;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  isSameLocalDay(
    d1: Date | string | null | undefined,
    d2: Date | string | null | undefined,
  ): boolean {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);

    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  getWeekDayIndex(date: Date): number {
    const day = new Date(date).getUTCDay();
    return day === 0 ? 6 : day - 1;
  }

  private getWeekDays(dateInput: Date | string | null | undefined): Date[] {
    const base = dateInput ? new Date(dateInput) : new Date();
    const current = isNaN(base.getTime()) ? new Date() : base;

    const dayOfWeek = current.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current);
    monday.setUTCDate(current.getUTCDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setUTCDate(monday.getUTCDate() + i);
      return day;
    });
  }

  getReservationForSlot(roomId: number, hour: number): ReservationDto | undefined {
    const selectedDate = this.store.daySelectedByUser();
    if (!selectedDate) return undefined;

    const reservations = this.store.reservations();
    if (!Array.isArray(reservations)) return undefined;

    return reservations.find((res) => {
      if (!res) return false;
      const resRoomId =
        typeof res.room === 'object' && res.room !== null ? (res.room as any).id : res.room;
      if (String(resRoomId) !== String(roomId)) return false;

      if (!this.isSameLocalDay(res.startAt, selectedDate)) return false;

      const startHour = new Date(res.startAt).getHours();
      const endHour = new Date(res.endAt).getHours();

      return hour >= startHour && hour < endHour;
    });
  }

  selectRoomAndHour(roomId: number, hour: number): void {
    if (!this.auth.currentUser()) {
      this.store.isLoginOrRegisterModalActive.set(true);
      return;
    }
    let day = new Date();
    if (this.store.daySelectedByUser()) {
      day = this.store.daySelectedByUser();
    } else {
      this.store.daySelectedByUser.set(day);
    }

    day.setHours(hour);
    if (this.isPastHour(hour)) return;

    this.store.selectedHour.set(hour);
    this.store.selectedRoom.set(
      (this.store.rooms() || []).find((r) => String(r.id) === String(roomId)) ??
        (this.store.rooms() || [])[0],
    );
    this.store.isBookingModalActive.set(true);

    const booking = this.createBookingObject(roomId, hour);
    this.store.selectedBooking.set(booking);
  }

  createBookingObject(roomId: number, hour: number): Booking {
    const rooms = this.store.rooms() || [];
    const foundRoom = rooms.find((r) => String(r.id) === String(roomId));

    let selectedDate = this.store.daySelectedByUser()
      ? new Date(this.store.daySelectedByUser()!)
      : new Date();
    selectedDate.setMinutes(0);
    selectedDate.setSeconds(0);

    return {
      date: selectedDate,
      hour,
      roomId,
      roomName: foundRoom ? foundRoom.name : '',
      duration: 1,
      reservationType: ReservationType.REHEARSAL,
      reservedByUserId: this.auth.currentUser()?.id,
    };
  }

  isReserved(roomId: number, hour: number): boolean {
    return !!this.getReservationForSlot(roomId, hour);
  }

  isForAdmin(roomId: number, hour: number): boolean {
    const res = this.getReservationForSlot(roomId, hour);
    return res?.type === ('ADMIN' as unknown as ReservationType);
  }

  isMyPrivate(roomId: number, hour: number): boolean {
    const res = this.getReservationForSlot(roomId, hour);
    if (!res) return false;

    const currentUserId = this.auth.currentUser?.()?.id;
    const resUserId = res.reservedBy || (res as any).userId;
    return resUserId === currentUserId && !res.organization;
  }

  isMyOrganization(roomId: number, hour: number): boolean {
    const res = this.getReservationForSlot(roomId, hour);
    if (!res || !res.organization) return false;

    const userOrgsData = this.store.organizations();

    if (Array.isArray(userOrgsData)) {
      return userOrgsData.some(
        (org: any) => String(org.id) === String(res.organization) || org.name === res.organization,
      );
    }

    if (userOrgsData && typeof userOrgsData === 'object' && 'organizations' in userOrgsData) {
      const orgs = (userOrgsData as any).organizations;
      if (Array.isArray(orgs)) {
        return orgs.some(
          (org: any) =>
            String(org.id) === String(res.organization) || org.name === res.organization,
        );
      }
    }

    return false;
  }

  isFirstHourOfReservation(roomId: number, hour: number): boolean {
    const res = this.getReservationForSlot(roomId, hour);
    if (!res?.startAt) return false;

    const startDate = new Date(res.startAt);
    const startHour = startDate.getHours();
    return startHour === hour;
  }

  isLastHourOfReservation(roomId: number, hour: number): boolean {
    const res = this.getReservationForSlot(roomId, hour);
    if (!res?.endAt) return false;

    const endDate = new Date(res.endAt);
    const endHour = endDate.getHours();
    return endHour - 1 === hour;
  }

  isPastHour(hour: number): boolean {
    const selectedDate = this.store.daySelectedByUser();
    if (!selectedDate) return false;

    const dateObj = new Date(selectedDate);
    dateObj.setHours(hour, 0, 0, 0);

    return dateObj.getTime() < Date.now();
  }
}
