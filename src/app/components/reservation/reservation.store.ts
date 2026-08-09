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
import { initialPage, Page } from '../../model/page';
import { ReservationStatus } from '../../model/reservationStatus';
import { TranslocoService } from '@jsverse/transloco';
import { Tab } from '../../model/tab';
import { OrganizationMemberDto } from '../../model/organizationMemberDto';
import { ReservationType } from '../../model/reservationType';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ToolbarType } from '../toolbars/toolbarType';

@Injectable({ providedIn: 'root' })
export class ReservationStore {
  private helper = inject(CalendarHelper);
  private authService = inject(AuthService);
  readonly loco = inject(TranslocoService);
  private readonly route = inject(ActivatedRoute);

  readonly allUsers = signal<User[]>([]);

  readonly rooms = signal<Room[]>([]);
  readonly reservations = computed(() => this.reservationsPage().content);

  readonly users = computed(() => this.usersPage().content);
  readonly userOrganizations = signal<Organization[]>([]);

  readonly organizations = computed(() => this.organizationsPage().content);
  readonly allOrganizations = signal<Organization[]>([]);
  readonly orgAndMembersMap = signal<Map<Organization, User[]>>(new Map());

  readonly daySelectedByUser = signal<Date>(new Date());
  readonly currentWeekStart = signal<Date>(this.helper.getStartOfWeek(new Date()));
  readonly currentMonthDate = signal<Date>(new Date());
  readonly testText = signal<string>('');
  readonly reservationTypeBooking = signal<ReservationType | null>(null);

  readonly reservationTypeOptions = computed(() => {
    const reherseal = ReservationType.REHERSEAL;
    const recording = ReservationType.RECORDING;

    return Array.of(reherseal, recording);
  });

  readonly durationOptions = computed(() => {
    const booking = this.selectedBooking();
    if (!booking) return [];

    const reservs = this.currentDayReservations();

    const reservsForRoom = reservs.filter((res) => res.room === booking?.roomId);
    const bookingStartHour = booking?.hour;
    let limitHour = 22;

    for (const res of reservsForRoom) {
      const resStartHour = new Date(res.startAt).getUTCHours();

      if (resStartHour < limitHour && resStartHour > bookingStartHour) {
        limitHour = resStartHour;
      }
    }

    const maxDuration = limitHour - bookingStartHour;
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
    reservationType: ReservationType;
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
  readonly isModalAddOwnerActive = signal<boolean>(false);
  readonly isBanModalActive = signal<boolean>(false);
  readonly isBanUsersModalActive = signal<boolean>(false);
  readonly isBanUsersSuccessActive = signal<boolean>(false);
  readonly isReservationDetailsModalActive = signal<boolean>(false);
  readonly isUserDetailsModalActive = signal<boolean>(false);
  readonly isOrganizationDetailsModalActive = signal<boolean>(false);
  readonly isModalAddOwnerSuccessActive = signal<boolean>(false);
  readonly isModalAddMemberSuccessActive = signal<boolean>(false);

  readonly confirmMarkReservationAsAccepted = signal<boolean>(false);
  readonly confirmMarkReservationAsRequestCancel = signal<boolean>(false);
  readonly confirmMarkReservationAsCanceled = signal<boolean>(false);
  readonly confirmMarkReservationAsRejected = signal<boolean>(false);

  readonly popupMarkedReservationAsAccepted = signal<boolean>(false);
  readonly popupMarkedReservationAsRequestCancel = signal<boolean>(false);
  readonly popupMarkedReservationAsCanceled = signal<boolean>(false);
  readonly isPrivateReservationCheckboxActivated = signal<boolean>(false);

  readonly statusForAdminPage = signal<ReservationStatus | null>(null);

  readonly isAddOrganizationModalActive = signal<boolean | null>(null);

  readonly popupConfirmationActive = signal<boolean | null>(null);

  readonly organizationListSelectedUser = signal<User | null>(null);
  readonly selectedOrganization = signal<Organization | null>(null);
  readonly selectedReservation = signal<ReservationDto | null>(null);
  readonly selectedUser = signal<User | null>(null);
  readonly selectedReservations = signal<ReservationDto[] | null>(null);

  readonly globalErrorKey = signal<string | null>(null);

  // =================

  //  pagination
  readonly reservationsPage = signal<Page<ReservationDto>>(initialPage);
  readonly usersPage = signal<Page<User>>(initialPage);
  readonly organizationsPage = signal<Page<Organization>>(initialPage);

  //params

  readonly reservationsPageQueryParamName = signal<string>('resPage');
  readonly organizationsPageQueryParamName = signal<string>('orgsPage');
  readonly usersPageQueryParamName = signal<string>('usersPage');

  readonly reservationsSizeQueryParamName = signal<string>('resSize');
  readonly organizationsSizeQueryParamName = signal<string>('orgsSize');
  readonly usersSizeQueryParamName = signal<string>('usersSize');

  // size

  readonly currentReservationsSize = computed(
    () => Number(this.queryParams()[this.reservationsSizeQueryParamName()]) || 10,
  );
  readonly currentOrganizationsSize = computed(
    () => Number(this.queryParams()[this.organizationsSizeQueryParamName()]) || 10,
  );
  readonly currentUsersSize = computed(
    () => Number(this.queryParams()[this.usersSizeQueryParamName()]) || 10,
  );

  // page

  readonly currentReservationsPage = computed(
    () => Number(this.queryParams()[this.reservationsPageQueryParamName()]) || 0,
  );
  readonly currentUsersPage = computed(
    () => Number(this.queryParams()[this.usersPageQueryParamName()]) || 0,
  );
  readonly currentOrganizationsPage = computed(
    () => Number(this.queryParams()[this.organizationsPageQueryParamName()]) || 0,
  );

  // Toolbar

  readonly toolbarSelectedIds = signal<Set<number>>(new Set());

  toggleSelection(id: number): void {
    this.toolbarSelectedIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  setSelectedIds(ids: Set<number>): void {
    this.toolbarSelectedIds.set(ids);
  }

  clearSelection(): void {
    this.toolbarSelectedIds.set(new Set());
  }

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

  // search bar

  readonly searchBarQuery = signal<string | null>('');

  readonly filteredReservations = computed<ReservationDto[]>(() => {
    const query = (this.searchBarQuery() ?? '').trim().toLowerCase();
    const reservations = this.reservations();

    if (!query) return reservations;

    const matchingUserIds = new Set(
      this.allUsers()
        .filter(
          (u) => u.nick?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query),
        )
        .map((u) => u.id),
    );

    const matchingRoomIds = new Set(
      this.rooms()
        .filter((r) => r.name?.toLowerCase().includes(query))
        .map((r) => r.id),
    );

    const matchingOrgIds = new Set(
      this.allOrganizations()
        .filter((o) => o.name?.toLowerCase().includes(query))
        .map((o) => o.id),
    );

    return reservations.filter((r) => {
      const matchesRoom = matchingRoomIds.has(r.room);

      const isOrg = r.organization !== null && r.organization !== undefined;

      const matchesReservedBy = isOrg
        ? matchingOrgIds.has(r.organization)
        : matchingUserIds.has(r.reservedBy);

      return matchesRoom || matchesReservedBy;
    });
  });

  // ======= Sorting params

  readonly toolbarType = signal<ToolbarType | null>(null);

  readonly queryParams = toSignal(this.route.queryParams, {
    initialValue: {} as Params,
  });
  readonly currentSortBy = computed<string>(() => {
    switch (this.toolbarType()) {
      case ToolbarType.USERS:
        return (this.queryParams()['sortBy'] as string) ?? 'nick';
      case ToolbarType.RESERVATION_BY_STATUS:
        return (this.queryParams()['sortBy'] as string) ?? 'id';
      default:
        return (this.queryParams()['sortBy'] as string) ?? 'id';
    }
  });

  readonly currentSortDir = computed(
    () => (this.queryParams()['sortDir'] as 'asc' | 'desc') ?? 'desc',
  );
}
