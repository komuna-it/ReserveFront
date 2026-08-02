import { computed, inject, Injectable, signal } from '@angular/core';
import { CalendarHelper } from '../calendar/calendar.helper';
import { OrganizationFront } from '../../model/organizationFront';
import { HourWrapper } from '../../model/hourWrapper';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth/authService';
import { Room } from '../../model/room';
import { ReservationDto } from '../../model/reservationDto';
import { Organization } from '../../model/organization';
import { User } from '../../model/user';
import { Page } from '../../model/page';
import { ReservationStatus } from '../../model/reservationStatus';
import { TranslocoService } from '@jsverse/transloco';
import { Tab } from '../../model/tab';
import { OrganizationMemberDto } from '../../model/organizationMemberDto';

@Injectable({ providedIn: 'root' })
export class ReservationStore {
  private helper = inject(CalendarHelper);
  private authService = inject(AuthService);
  readonly loco = inject(TranslocoService);

  readonly allUsers = signal<User[]>([]);

  readonly rooms = signal<Room[]>([]);
  readonly reservations = signal<ReservationDto[]>([]);

  readonly reservationsPage = signal<number>(0);
  readonly reservationsSize = signal<number>(100);

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

    const reservsForRoom = reservs.filter((res) => res.room === booking?.roomId);
    console.log('reservsForRoom: ', reservsForRoom);
    console.table(
      reservsForRoom.map((res) => ({ id: res.id, startAt: res.startAt, endAt: res.endAt })),
    );
    const bookingStartHour = booking?.hour;
    let limitHour = 22;

    for (const res of reservsForRoom) {
      const resStartHour = new Date(res.startAt).getUTCHours();

      if (resStartHour < limitHour && resStartHour > bookingStartHour) {
        limitHour = resStartHour;
      }
    }

    const maxDuration = limitHour - bookingStartHour;
    console.log('booking start hour: ', bookingStartHour);
    console.log('limit hour: ', limitHour);
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
        let privateReservationText = '';
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
            const userId = parseInt(this.authService.userId()!, 10);

            if (this.authService.isAdmin()) {
              const userText = this.allUsers().find(
                (u) => u.id === matchedReservation.reservedBy,
              )?.nick;
              reservationText = `${userText} (prywatna)`;
            } else if (matchedReservation.reservedBy === userId) {
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

  // ================= modals control =================

  readonly isAdminAddOrganizationModalActive = signal<boolean>(false);
  readonly isAdminOrganizationModalActive = signal<boolean>(false);
  readonly isAdminAddOrganizationSuccessPopupActive = signal<boolean>(false);
  readonly isModalDeleteOrganizationActive = signal<boolean>(false);
  readonly isModalDeleteMemberActive = signal<boolean>(false);
  readonly isModalDeleteOwnerActive = signal<boolean>(false);
  readonly isModalDeleteOrganizationSuccessActive = signal<boolean>(false);
  readonly isModalDeleteMemberSuccessActive = signal<boolean>(false);
  readonly isModalDeleteOwnerSuccessActive = signal<boolean>(false);
  readonly isModalAddMemberActive = signal<boolean>(false);
  readonly isBanModalActive = signal<boolean>(false);

  readonly confirmMarkReservationAsAccepted = signal<boolean>(false);
  readonly confirmMarkReservationAsRequestCancel = signal<boolean>(false);
  readonly confirmMarkReservationAsCanceled = signal<boolean>(false);

  readonly popupMarkedReservationAsAccepted = signal<boolean>(false);
  readonly popupMarkedReservationAsRequestCancel = signal<boolean>(false);
  readonly popupMarkedReservationAsCanceled = signal<boolean>(false);
  readonly isPrivateReservationCheckboxActivated = signal<boolean>(false);

  readonly statusForAdminPage = signal<ReservationStatus | null>(null);

  readonly isAddOrganizationModalActive = signal<boolean | null>(null);

  readonly popupConfirmationActive = signal<boolean | null>(null);

  readonly organizationListSelectedUser = signal<User | null>(null);
  readonly organizationListSelectedOrganization = signal<Organization | null>(null);
  readonly selectedReservation = signal<ReservationDto | null>(null);
  readonly selectedReservations = signal<ReservationDto[] | null>(null);

  readonly globalErrorKey = signal<string | null>(null);

  // =================

  // reservation pagination

  readonly reservationsByStatus = signal<ReservationDto[]>([]);
  readonly paginationTotalNumber = signal<number>(0);
  readonly paginationTotalPages = signal<number>(0);
  readonly paginationPage = signal<number>(0);
  readonly paginationIsFirst = signal<boolean>(false);
  readonly paginationIsLast = signal<boolean>(false);

  // org pagination

  readonly orgsTotalElements = signal<number>(0);
  readonly orgsTotalPages = signal<number>(0);
  readonly orgsPage = signal<number>(0);
  readonly orgsIsFirst = signal<boolean>(false);
  readonly orgsIsLast = signal<boolean>(false);
  readonly orgsSize = signal<number>(10);

  // users pagination

  readonly usersFiltered = computed(() => {
    return this.allUsers().filter((u) => u.nick != 'SYSTEM');
  });

  readonly usersTotalElements = computed(() => {
    return this.usersFiltered().length;
  });

  readonly userTotalPages = signal<number>(0);
  readonly userPage = signal<number>(0);
  readonly userIsFirst = signal<boolean>(false);
  readonly userIsLast = signal<boolean>(false);
  readonly userSize = signal<number>(10);

  // Reservation Toolbar

  readonly toolbarSelectedIds = signal<Set<number>>(new Set());
  readonly toolbarAreAllSelected = computed(() => {
    const currentItems = this.reservationsByStatus();
    if (currentItems.length === 0) return false;
    return currentItems.every((r) => this.toolbarSelectedIds().has(r.id));
  });

  readonly toolbarIsNoneSelected = computed(() => {
    return this.toolbarSelectedIds().size === 0;
  });
  readonly toolbarIsIndeterminated = computed(() => {
    return this.toolbarSelectedIds().size > 0 && !this.toolbarAreAllSelected();
  });

  // Users Toolbar

  readonly toolbarUserSelectedIds = signal<Set<number>>(new Set());
  readonly toolbarAreAllUsersSelected = computed(() => {
    const currentItems = this.allUsers();
    if (currentItems.length === 0) return false;
    return currentItems.every((r) => this.toolbarSelectedIds().has(r.id));
  });
  readonly toolbarUserIsNoneSelected = computed(() => {
    return this.toolbarSelectedIds().size === 0;
  });
  readonly toolbarUserIsIndeterminated = computed(() => {
    return this.toolbarSelectedIds().size > 0 && !this.toolbarAreAllUsersSelected();
  });

  /// profile

  activeTab = signal<Tab>(new Tab(0, 'Moje rezerwacje', 'reservations', undefined));
  allTabs = computed(() => {
    let id = 0;
    const newTabs: Tab[] = [];

    newTabs.push(new Tab(id++, 'Moje rezerwacje', 'reservations', undefined));

    for (const org of this.userOrganizations()) {
      newTabs.push(new Tab(id++, org.name, 'organization', org));
    }
    newTabs.push(new Tab(id++, 'Utwórz zespół', 'createorganization', undefined));

    return newTabs;
  });

  readonly allMembersOfOrganization = computed(() => {
    const org = this.activeTab().org;
    const members = org?.members ?? [];
    const owners = org?.owners ?? [];
    const membersAndOwners: OrganizationMemberDto[] = [...members, ...owners];

    return membersAndOwners;
  });

  // ban

  readonly banReason = signal<string>('');
  readonly banDuration = signal<string>('');
}
