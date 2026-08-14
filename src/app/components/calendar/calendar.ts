import { Component, inject, Input, OnInit, OnDestroy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarHelper } from './calendar.helper';
import { ReservationStore } from '../reservation/reservation.store';
import { ReservationFacade } from '../reservation/reservation.facade';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../auth/authService';
import { CalendarBookingModal } from '../modals/calendar-booking-modal/calendar-booking-modal';
import { CalendarHour } from '../calendar-hour/calendar-hour';
import { SuccessPopup } from '../../modals/success-popup/success-popup';
import { ErrorPopup } from '../../modals/error-popup/error-popup';
import { HourWrapper } from '../../model/hourWrapper';
import { CalendarReservation } from '../calendar-reservation/calendar-reservation';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    SuccessPopup,
    ErrorPopup,
    CommonModule,
    FormsModule,
    TranslocoPipe,
    CalendarBookingModal,
    CalendarHour, CalendarReservation
  ],
  templateUrl: './calendar.html',
})
export class CalendarComponent implements OnInit, OnDestroy {
  translocoService = inject(TranslocoService);
  readonly helper = inject(CalendarHelper);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);
  readonly loco = inject(TranslocoService);

  ngOnInit() {
    this.facade.getRoomsAndReservations();
    this.facade.getAllUsers();

    if (!this.authService.userId()) {
      console.error('User id not loaded yet');
      return;
    }

    console.log('Initializing calendar...');
    this.facade.refreshOrganizations();
    this.facade.connectToReservationStream();
  }

  ngOnDestroy() {
    this.facade.disconnectStream();
  }




  // NEW CALENDAR

  constructor() {


    effect( () => {
        this.store.reservations();
        this.generateCalendar();
    });



  }

  readonly activeLang = this.loco.activeLang(); 

  getDayNames(format: 'long' | 'short' | 'narrow' = 'long'): string[] {
    const lang = this.loco.getActiveLang();
    const formatter = new Intl.DateTimeFormat(lang, { weekday: format });
    
    return Array.from({ length: 7 }, (_, i) => {
      return formatter.format(new Date(2024, 0, 1 + i));
    });
  }

  getMonthNames(format: 'long' | 'short' | 'narrow' = 'long'): string[] {
  const lang = this.loco.getActiveLang();
  const formatter = new Intl.DateTimeFormat(lang, { month: format });
  
    return Array.from({ length: 12 }, (_, i) => {
      return formatter.format(new Date(2024, 1 + i));
    });
  }


    getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
  }

    readonly hoursRange = Array.from({ length: 12 }, (_, i) => i + 10); // 10:00 - 21:00


getDatesToDisplay(): Date[] {
  const now = new Date();
  const firstDayOfWeek = this.getStartOfWeek(now);
  const weekOfDates: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const newDate = new Date(firstDayOfWeek);
    newDate.setDate(firstDayOfWeek.getDate() + i);

    weekOfDates.push(newDate);
  }

  return weekOfDates;
}



generateCalendar = computed( () => {
    const hoursRange = this.hoursRange;
    const daysToDisplay =  this.getDatesToDisplay();
    const rooms = this.store.rooms();
    const daysWithHours : Date[] = [];

    daysToDisplay.forEach( d => {
      hoursRange.forEach( h => {
        const dateWithHour = new Date(d);
        dateWithHour.setHours(h);
        daysWithHours.push(dateWithHour);
      });
    };
    
    return daysToDisplay;
}) ;



  // OLD CALENDAR

    readonly tableRows = computed(() => {
    const isAdmin = this.authService.isAdmin();
    const selectedDate = this.store.daySelectedByUser();
    const reservationsToday = this.store.currentDayReservations();
    const roomsList = this.store.rooms();
    const userOrgs = this.store.userOrgsMap();
    const allOrgs = this.store.allOrgsMap();
    const hoursRange = this.helper.hoursRange;
    const privateReservationText = this.loco.translate('ADMIN_RESERVATIONS.IS_PRIVATE');
    const now = new Date();
    const isPastDay =
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) <
      new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isToday = this.helper.isSameDay(selectedDate, now);
    const currentHour = now.getHours();

    return hoursRange.map((hour) => {
      const isPastHour = isPastDay || (isToday && hour <= currentHour);

      const cells = roomsList.map((room) => {
        const matchedReservation = reservationsToday.find((res) => {
          if (res.room !== room.id) return false;
          const startHour = new Date(res.startAt).getUTCHours();
          const endHour = new Date(res.endAt).getUTCHours();
          return hour >= startHour && hour < endHour;
        });

        const isReserved = !!matchedReservation;
        let isFirst = false;
        let isLast = false;
        let isMyOrg = false;
        let bandName = '';
        let isPrivateReservation = false;
        let privateReservationText = 'Moja prywatna';
        let reservedByUserId: number | null = null;
        let reservationText = '';
        let isMyPrivateReservation = false;

        if (matchedReservation) {
          const startHour = new Date(matchedReservation.startAt).getUTCHours();
          isFirst = hour === startHour;
          isLast = hour === new Date(matchedReservation.endAt).getUTCHours() - 1;
          reservedByUserId = matchedReservation.reservedBy;
          if (matchedReservation.organization) {
            if (isAdmin) {
              bandName =
                allOrgs.get(matchedReservation.organization) ||
                `${matchedReservation.organization}`;
              isMyOrg = false;
              reservationText = bandName;
            } else {
              if (userOrgs.has(matchedReservation.organization)) {
                isMyOrg = true;
                bandName = userOrgs.get(matchedReservation.organization) || '';
                reservationText = bandName;
              } else {
                isMyOrg = false;
                bandName = '';
                reservationText = bandName;
              }
            }
          }

          if (matchedReservation.organization === null) {
            isPrivateReservation = true;
            const loggedUserId = parseInt(this.authService.userId()!, 10);

            if (this.authService.isAdmin()) {
              const userText = this.store.users().find(
                (u) => u.id === matchedReservation.reservedBy,
              )?.nick;
              reservationText = `${userText} (prywatna)`;
            } else if (matchedReservation.reservedBy === loggedUserId) {
              reservationText = privateReservationText;
              isMyPrivateReservation = true;
            } else {
              reservationText = '';
            }
          }
        }

        return {
          roomId: room.id ?? 0,
          hourWrapper: new HourWrapper(
            hour,
            isReserved,
            isFirst,
            isLast,
            isMyOrg,
            isPastHour,
            bandName,
            isPrivateReservation,
            privateReservationText,
            reservedByUserId,
            reservationText,
            isMyPrivateReservation,
          ),
        };
      });

      return { hour, cells };
    });
  });

}
