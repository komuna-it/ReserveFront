import { inject, Injectable, isDevMode } from '@angular/core';
import { ReservationApi } from './reservation.api';
import { ReservationStore } from './reservation.store';
import { OrganizationStore } from '../organization/organization.store';
import { UserStore } from '../user/user.store';
import { CalendarHelper } from '../../components/calendar/calendar.helper';
import { AuthService } from '../../auth/authService';
import { ActivatedRoute, Router } from '@angular/router';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ReservationType } from '../../model/reservationType';
import { CreateReservationRequest } from '../../model/CreateReservationRequest';
import { ReservationStatus } from '../../model/reservationStatus';
import { ReservationDto } from '../../model/reservationDto';
import { Booking } from '../../model/booking';
import { finalize, forkJoin } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { SettingsFacade } from '../../settings/settingsFacade';
import { SettingsStore } from '../../settings/settingsStore';
import { environment } from '../../../environments/environment';
import { ErrorType } from '../../model/error/errorType';
import { ReservationQueryParams } from '../../model/reservationQueryParams';
import { ConfirmationType } from '../../model/confirmationType';
import { TextFormatingTool } from '../../tools/textFormatingTool';
import { ReservationTableType } from '../../model/reservationTableType';
import { ViewController } from '../view/view.controller';
import { ViewStore } from '../view/view.store';

@Injectable({ providedIn: 'root' })
export class ReservationFacade {
  private api = inject(ReservationApi);
  private loco = inject(TranslocoService);
  private store = inject(ReservationStore);
  private userStore = inject(UserStore);
  private orgStore = inject(OrganizationStore);
  private helper = inject(CalendarHelper);
  private authService = inject(AuthService);
  private router = inject(Router);
  private sseController: AbortController | null = null;
  public settingsFacade = inject(SettingsFacade);
  public settingsStore = inject(SettingsStore);

  private readonly viewController = inject(ViewController);
  private readonly viewStore = inject(ViewStore);
  private readonly route = inject(ActivatedRoute);
  private apiUrl = environment.apiUrl;
  readonly textFormatingTool = inject(TextFormatingTool);
  readonly reservationTableType = this.store.reservationTableType.asReadonly();

  constructor() {
    this.settingsFacade.getSettings(null, true);
    this.getRooms();
  }

  getRooms() {
    this.api.getRooms().subscribe({
      next: (rooms) => {
        this.store.rooms.set(rooms);
      },
      error: (e) => console.log('Error fetching rooms: ', e),
    });
  }

  postRoom(name: string) {
    return this.api.postRoom(name).subscribe({
      next: () => {
        console.log(`posted room ${name}`);
        this.getRooms();
      },
      error: (e) => {
        console.error(`error posting room ${name}`);
        this.viewController.showError('ACTION_FAILED' as any);
      },
    });
  }

  getRoomsAndReservations() {
    this.api.getRooms().subscribe({
      next: (rooms) => {
        this.store.rooms.set(rooms);
      },
      error: (e) => console.log('Error fetching rooms: ', e),
    });
    const status = this.store.reservationTableStatus();
    if (status) {
      this.getReservations({
        statuses: new Set<ReservationStatus>([status]),
        future: this.store.toolbarOnlyFuture(),
      });
    }
  }

  confirmBooking(): void {
    const booking = this.store.selectedBooking();
    if (!booking) return;

    const startAt = new Date(booking.date).toISOString();

    const req: CreateReservationRequest = {
      roomId: booking.roomId,
      startAt,
      duration: `PT${booking.duration}H`,
      type: booking.reservationType ?? ReservationType.REHEARSAL,
      organizationId: this.store.isPrivateReservationCheckboxActivated()
        ? null
        : booking.organizationId,
      reservedByUserId: booking.reservedByUserId,
    };

    this.api.postReservation(req).subscribe({
      next: (res) => {
        this.store.selectedBooking.set(null);
        this.viewController.showSuccess('SUCCESS' as any);
        this.getRoomsAndReservations();
        this.loadCalendarReservationsForDay(this.store.daySelectedByUser());
      },
      error: (err) => {
        console.error('Booking error response:', err);
        this.store.selectedBooking.set(null);
        this.viewController.showError('ACTION_FAILED' as any);
      },
    });
  }

  selectDay(day: Date) {
    this.store.daySelectedByUser.set(day);
    this.store.currentWeekStart.set(this.helper.getStartOfWeek(day));
    this.store.currentMonthDate.set(new Date(day.getFullYear(), day.getMonth(), 1));
  }

  navigateWeek(direction: 'prev' | 'next') {
    const current = new Date(this.store.daySelectedByUser());
    current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    this.selectDay(current);
  }

  navigateMonth(direction: 'prev' | 'next') {
    const d = new Date(this.store.currentMonthDate());
    d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
    this.store.currentMonthDate.set(d);
    this.selectDay(d);
  }

  openBookingModal(hour: number, roomId: number) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    const day = this.store.daySelectedByUser();
    const price = this.store.price();
    const userOrgs = this.orgStore.userOrganizations();
    const allOrgs = this.orgStore.organizations();
    let defaultOrg = userOrgs[0]?.id;

    if (!defaultOrg && this.authService.isAdmin()) {
      defaultOrg = allOrgs[0]?.id;
    }

    const rawUserId = (this.authService.userId() || '0').toString().replace(/['"]/g, '');

    this.store.selectedBooking.set({
      date: day,
      hour,
      roomId,
      price: price ?? 9999,
      duration: 1,
      roomName: this.store.rooms().find((r) => r.id === roomId)?.name,
      organizationId: defaultOrg || 0,
      reservedByUserId: parseInt(rawUserId, 10),
      reservationType: this.store.selectedReservationType() ?? ReservationType.REHEARSAL,
    });
  }

  disconnectStream() {
    if (this.sseController) {
      this.sseController.abort();
      this.sseController = null;
    }
  }

  connectToReservationStream() {
    this.disconnectStream();
    this.sseController = new AbortController();

    const url = `${this.apiUrl}/sse`;
    fetchEventSource(url, {
      method: 'GET',
      signal: this.sseController.signal,
      headers: {
        Accept: 'text/event-stream',
      },
      onopen: async (response) => {
        if (!response.ok && isDevMode()) {
          console.error('SSE connection failed with status:', response.status);
        }
      },
      onmessage: (msg) => {
        if (!msg.data) return;

        try {
          const res: ReservationDto = JSON.parse(msg.data);

          if (msg.event === 'RESERVATION_CREATED' || msg.event === 'RESERVATION_REMOVED') {
            this.refreshCurrentReservations();
            if (this.authService.isAdmin()) {
              this.getReservationsCountByStatus();
            }
          }

          if (msg.event === 'RESERVATION_CREATED') {
            this.store.newReservationEvent.set(res);
          }

          const safeUserId = parseInt(
            (this.authService.userId() || '').toString().replace(/['"]/g, ''),
            10,
          );
          const currentBooking = this.store.selectedBooking() ?? null;
          const isColizion = this.isSseReservationColiding(res, currentBooking);

          if (
            (msg.event === 'RESERVATION_CREATED' || msg.event === 'RESERVATION_CONFIRMED') &&
            isColizion &&
            res.reservedBy !== safeUserId
          ) {
            this.viewController.showError(ErrorType.HOUR_ALREADY_RESERVED);
          }
        } catch (err) {
          console.error('Error parsing SSE message data:', err);
        }
      },
      onerror: (err) => {
        console.error('SSE Stream Error:', err);
      },
    });
  }

  isSseReservationColiding(res: ReservationDto, b: Booking | null): boolean {
    if (!b) return false;
    if (Number(res.room) !== Number(b.roomId)) return false;

    const resStartDate = new Date(res.startAt);
    const resEndDate = new Date(res.endAt);
    const bookingStartDate = new Date(b.date);
    bookingStartDate.setHours(b.hour, 0, 0, 0);

    const bookingEndDate = new Date(bookingStartDate);
    if (!b.duration) b.duration = 1;
    bookingEndDate.setHours(b.hour + b.duration, 0, 0, 0);

    return (
      resStartDate.getTime() < bookingEndDate.getTime() &&
      resEndDate.getTime() > bookingStartDate.getTime()
    );
  }

  deleteReservation(id: number) {
    this.api.deleteReservation(id).subscribe({
      next: () => console.log(`Successfully deleted reservation with id ${id}`),
      error: (e) => console.error(`Failed to delete reservation with id ${id}`, e),
    });
  }

  changeReservationsByStatusSize() {
    const currentStatus = this.store.statusForAdminPage();
    if (currentStatus) {
      this.getReservations({
        statuses: new Set<ReservationStatus>([currentStatus]),
        future: this.store.toolbarOnlyFuture(),
      });
    }
  }

  updateReservationsStatus(targetStatus: ReservationStatus): void {
    this.closeModals();
    let selectedIds = this.store.toolbarSelectedIds();
    const idsToProcess = new Set<number>(selectedIds);

    if (idsToProcess.size === 0) {
      const singleId = this.store.selectedReservation()?.id;
      if (singleId) idsToProcess.add(singleId);
    }

    if (idsToProcess.size === 0) return;

    this.api.updateReservationsStatus(idsToProcess, targetStatus).subscribe({
      next: () => {
        if (this.authService.isAdmin()) {
          const status = this.store.statusForAdminPage();
          if (status)
            this.getReservations({
              statuses: new Set<ReservationStatus>([status]),
              future: this.store.toolbarOnlyFuture(),
            });
        }

        if (this.store.reservationTableType() === ReservationTableType.CALENDAR) {
          this.store.reservationsPage.update((currentPage) => ({
            ...currentPage,
            content: currentPage.content
              .map((res) => (idsToProcess.has(res.id) ? { ...res, status: targetStatus } : res))
              .filter(
                (res) =>
                  res.status !== ReservationStatus.CANCELLED &&
                  res.status !== ReservationStatus.REJECTED,
              ),
          }));
        }

        if (this.reservationTableType() === ReservationTableType.USER_PROFILE) {
          this.refreshCurrentReservations();
        }

        this.store.clearSelection();
        this.getReservationsCountByStatus();
      },
      error: (err: unknown) => {
        console.error('Error updating reservation status:', err);
        this.viewController.showError(ErrorType.STATUS_UPDATE_FAILED);
      },
    });
  }

  changeReservationsPage(newPage: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [this.store.reservationsPageQueryParamName()]: newPage },
      queryParamsHandling: 'merge',
    });
  }

  changeReservationsSize(newSize: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [this.store.reservationsSizeQueryParamName()]: newSize,
        [this.store.reservationsPageQueryParamName()]: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  closeModals(): void {
    this.store.selectedBooking.set(null);
    this.viewController.closeModals();
  }

  handleAcceptReservations(resIds: Set<number>) {
    this.store.toolbarSelectedIds.set(resIds);
    this.updateReservationsStatus(ReservationStatus.CONFIRMED);
    this.viewStore.confirmMarkReservationAsAccepted.set(false);
    this.viewController.showSuccess('SUCCESS' as any);
  }

  handleCancelReservation(resIds: Set<number>) {
    this.store.toolbarSelectedIds.set(resIds);
    this.updateReservationsStatus(ReservationStatus.CANCELLED);
    this.viewStore.confirmMarkReservationAsCanceled.set(false);
    this.viewController.showSuccess('SUCCESS' as any);
  }

  openConfirmationUpdateReservationsStatus(
    reservations: ReservationDto[],
    status: ReservationStatus,
  ) {
    this.store.selectedReservations.set(reservations);
    this.closeModals();

    switch (status) {
      case ReservationStatus.CONFIRMED:
        this.viewStore.confirmMarkReservationAsAccepted.set(true);
        break;
      case ReservationStatus.CANCELLED:
        this.viewStore.confirmMarkReservationAsCanceled.set(true);
        this.store.selectedReservations.set(
          this.store.reservations().filter((r) => this.store.toolbarSelectedIds().has(r.id)),
        );
        break;
      case ReservationStatus.REJECTED:
      case ReservationStatus.REJECTED_CANCELLATION:
        this.viewStore.confirmMarkReservationAsRejected.set(true);
        break;
      case ReservationStatus.REQUESTED_CANCELLATION:
        this.viewStore.confirmMarkReservationAsRequestCancel.set(true);
        break;
    }
  }

  searchReservations(): ReservationDto[] {
    const query = (this.store.searchBarQuery() ?? '').trim().toLowerCase();
    const reservations = this.store.reservations();

    if (!query) return reservations;

    const matchingUserIds = new Set(
      this.userStore
        .allUsers()
        .filter(
          (u) => u.nick?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query),
        )
        .map((u) => u.id),
    );

    const matchingRoomIds = new Set(
      this.store
        .rooms()
        .filter((r) => r.name?.toLowerCase().includes(query))
        .map((r) => r.id),
    );

    const matchingOrgIds = new Set(
      this.orgStore
        .organizations()
        .filter((o) => o.name?.toLowerCase().includes(query))
        .map((o) => o.id),
    );

    return reservations.filter((reservation: ReservationDto) => {
      const matchesRoom = matchingRoomIds.has(reservation.room);
      const isOrgReservation =
        reservation.organization !== null && reservation.organization !== undefined;
      const matchesReservedBy = isOrgReservation
        ? matchingOrgIds.has(reservation.organization)
        : matchingUserIds.has(reservation.reservedBy);

      return matchesRoom || matchesReservedBy;
    });
  }

  postPriceForRoomId(roomId: number, resType: ReservationType, price: number) {
    this.store.pricingLoadingState.set({ roomId, type: resType });
    this.api
      .postPriceForRoomId(roomId, resType, price)
      .pipe(finalize(() => this.store.pricingLoadingState.set(null)))
      .subscribe({
        next: () => this.getRooms(),
        error: (e) => console.error('Error postPriceForRoomId: ', e),
      });
  }

  saveMultiplePrices(
    updates: { roomId: number; type: ReservationType; price: number }[],
    onComplete: () => void,
  ) {
    const requests = updates.map((update) =>
      this.api.postPriceForRoomId(update.roomId, update.type, update.price),
    );

    forkJoin(requests)
      .pipe(finalize(() => onComplete()))
      .subscribe({
        next: () => this.getRooms(),
        error: (e) => console.error('Error saving multiple prices: ', e),
      });
  }

  isRoomRecordable(roomId: number, recordable: boolean) {
    this.api.isRoomRecordable(roomId, recordable).subscribe({
      next: () => this.getRooms(),
      error: (e) => console.error('Error isRoomRecordable: ', e),
    });
  }

  isReservationPaid(reservationId: Set<number>, paid: boolean) {
    return this.api.isReservationPaid(reservationId, paid).subscribe({
      next: (updatedReservations) => {
        const updatedMap = new Map(updatedReservations.map((r) => [r.id, r]));
        this.store.reservationsPage.update((page) => {
          if (!page?.content) return page;
          return {
            ...page,
            content: page.content.map((item) => updatedMap.get(item.id) ?? item),
          };
        });
      },
      error: (e) => console.error('Error updating reservation paid status: ', e),
    });
  }

  loadCalendarReservationsForDay(selectedDate: Date): void {
    const allowedStatuses = new Set<ReservationStatus>([
      ReservationStatus.CREATED,
      ReservationStatus.CONFIRMED,
      ReservationStatus.REQUESTED_CANCELLATION,
      ReservationStatus.REJECTED_CANCELLATION,
    ]);

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    this.getReservations({
      statuses: allowedStatuses,
      future: false,
      startAtAfter: startOfDay.toISOString(),
      startAtBefore: endOfDay.toISOString(),
    });
  }

  getReservations(filters: ReservationQueryParams) {
    this.store.lastReservationFilters.set(filters);

    const requestParams: ReservationQueryParams = {
      ...filters,
      page: filters.page ?? this.store.currentReservationsPage(),
      size: filters.size ?? this.store.currentReservationsSize(),
      sortBy: filters.sortBy ?? this.store.currentSortBy(),
      sortDir: filters.sortDir ?? this.store.currentSortDir(),
    };

    this.api.getReservations(requestParams).subscribe({
      next: (pageData) => this.store.reservationsPage.set(pageData),
      error: (e) => console.log('Error fetching res: ', e),
    });
  }

  refreshCurrentReservations() {
    const filters = this.store.lastReservationFilters();
    if (filters) this.getReservations(filters);
  }

  getReservationsCountByStatus() {
    this.store.isCountLoading.set(true);
    this.api.getReservationsCountByStatus().subscribe({
      next: (data: any) => {
        const statusMap = new Map<ReservationStatus, number>(
          Object.entries(data || {}) as [ReservationStatus, number][],
        );
        this.store.reservationsCount.set(statusMap);
        this.store.isCountLoading.set(false);
      },
      error: (e) => {
        console.log('Error fetching res: ', e);
        this.store.isCountLoading.set(false);
      },
    });
  }

  isCancellationPossible(res: ReservationDto): boolean {
    return (
      res.status !== ReservationStatus.REQUESTED_CANCELLATION &&
      res.status !== ReservationStatus.REJECTED &&
      res.status !== ReservationStatus.CANCELLED
    );
  }

  canCancelWithoutAsking(res: ReservationDto) {
    const paramCanCancelWithoutAsking =
      this.settingsStore
        .settings()
        .find((s) => s.key === 'RESERVATION_CANCELLATION_WITHOUT_APPROVAL_HOURS')?.value ?? '24';
    const hourPeriod = parseInt(paramCanCancelWithoutAsking);
    const startDate = new Date(res.startAt);
    const now = new Date();
    const timeDifference = startDate.getTime() - now.getTime();
    return timeDifference / (1000 * 60 * 60) >= hourPeriod;
  }

  getCancelButtonLabel(res: ReservationDto): string {
    switch (res.status) {
      case ReservationStatus.CREATED:
      case ReservationStatus.CONFIRMED:
        return this.canCancelWithoutAsking(res)
          ? this.loco.translate('BUTTONS.CANCEL')
          : this.loco.translate('BUTTONS.REQUEST_CANCEL');
      case ReservationStatus.CANCELLED:
        return this.loco.translate('STATUS.CANCELLED');
      case ReservationStatus.REJECTED:
        return this.loco.translate('STATUS.REJECTED');
      case ReservationStatus.REQUESTED_CANCELLATION:
        return this.loco.translate('BUTTONS.ASKED_FOR_CANCELLATION');
      default:
        return '';
    }
  }

  updateResStatusBasedOnConfirmationType(): void {
    const type = this.viewStore.pendingConfirmationType();
    const res = this.viewStore.pendingConfirmationReservation();

    this.viewStore.isConfirmationPopupActive.set(false);
    this.viewStore.pendingConfirmationType.set(null);
    this.viewStore.pendingConfirmationReservation.set(null);

    if (!res || !type) return;

    this.store.toolbarSelectedIds.set(new Set<number>([res.id]));

    switch (type) {
      case ConfirmationType.RESERVATION_CANCEL:
        this.updateReservationsStatus(ReservationStatus.CANCELLED);
        break;
      case ConfirmationType.RESERVATION_REJECT:
        this.updateReservationsStatus(ReservationStatus.REJECTED);
        break;
      case ConfirmationType.RESERVATION_ACCEPT:
        this.updateReservationsStatus(ReservationStatus.CONFIRMED);
        break;
      case ConfirmationType.RESERVATION_REQUEST_CANCEL:
        this.updateReservationsStatus(ReservationStatus.REQUESTED_CANCELLATION);
        break;
      case ConfirmationType.RESERVATION_REQUEST_CANCEL_REJECT:
        this.updateReservationsStatus(ReservationStatus.REJECTED_CANCELLATION);
        break;
    }
  }
}
