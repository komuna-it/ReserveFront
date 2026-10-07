import { Component, computed, effect, inject, input } from '@angular/core';
import { ReservationStatus } from '../../../model/reservationStatus';
import { ReservationDto } from '../../../model/reservationDto';
import { ReservationFacade } from '../../../services/reservation/reservation.facade';
import { ReservationStore } from '../../../services/reservation/reservation.store';
import { OrganizationFacade } from '../../../services/organization/organization.facade';
import { OrganizationStore } from '../../../services/organization/organization.store';
import { UserStore } from '../../../services/user/user.store';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextFormatingTool } from '../../../tools/textFormatingTool';
import { CalendarHelper } from '../../calendar/calendar.helper';
import { CommonModule } from '@angular/common';
import { Pagination } from '../../../layout/pagination/pagination';
import { ReservationTableType } from '../../../model/reservationTableType';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ToolbarType } from '../../toolbars/toolbarType';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/authService';
import { ViewStore } from '../../../services/view/view.store';
import { ViewController } from '../../../services/view/view.controller';

@Component({
  selector: 'app-table-reservations',
  standalone: true,
  imports: [TranslocoPipe, CommonModule, Pagination],
  templateUrl: './table-reservations.html',
})
export class TableReservations {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly orgFacade = inject(OrganizationFacade);
  readonly orgStore = inject(OrganizationStore);
  readonly userStore = inject(UserStore);
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);

  readonly translocoService = inject(TranslocoService);
  readonly textFormatingTool = inject(TextFormatingTool);
  readonly calendarHelper = inject(CalendarHelper);
  readonly ReservationStatus = ReservationStatus;
  readonly ReservationTableType = ReservationTableType;
  readonly type = input<ReservationTableType>();
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  readonly status = input<ReservationStatus | null>();
  readonly toolbarType = input<ToolbarType | null>();

  readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Params });

  readonly sortedReservations = computed<ReservationDto[]>(() => {
    const items = this.store.reservations();
    const sortBy = this.store.currentSortBy();
    const sortDir = this.store.currentSortDir();

    if (sortBy === 'reservedBy.nick' || sortBy === 'reservedBy') {
      return [...items].sort((a, b) => {
        const textA = this.textFormatingTool.reservedByText(a);
        const textB = this.textFormatingTool.reservedByText(b);
        const comparison = textA.localeCompare(textB, undefined, {
          sensitivity: 'base',
          numeric: true,
        });
        return sortDir === 'asc' ? comparison : -comparison;
      });
    }

    return items;
  });

  isCancellationPossible(res: ReservationDto): boolean {
    if (
      res.status === ReservationStatus.REQUESTED_CANCELLATION ||
      res.status === ReservationStatus.REJECTED_CANCELLATION ||
      res.status === ReservationStatus.CANCELLED ||
      res.status === ReservationStatus.REJECTED
    ) {
      return false;
    }
    return true;
  }

  canCancelWithoutAsking(res: ReservationDto) {
    const startDate = new Date(res.startAt);
    const now = new Date();
    const timeDifference = startDate.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    return hoursDifference >= 24;
  }

  requestCancellation(res: ReservationDto) {
    const id = new Set<number>();
    id.add(res.id);
    this.store.toolbarSelectedIds.set(id);
    this.facade.updateReservationsStatus(ReservationStatus.REQUESTED_CANCELLATION);
  }

  getCancelButtonLabel(res: ReservationDto): string {
    switch (res.status) {
      case ReservationStatus.CREATED:
      case ReservationStatus.CONFIRMED: {
        if (this.canCancelWithoutAsking(res)) {
          return this.translocoService.translate('BUTTONS.CANCEL');
        } else {
          return this.translocoService.translate('BUTTONS.REQUEST_CANCEL');
        }
      }
      case ReservationStatus.CANCELLED:
        return this.translocoService.translate('STATUS.CANCELLED');
      case ReservationStatus.REJECTED:
        return this.translocoService.translate('STATUS.REJECTED');
      case ReservationStatus.REQUESTED_CANCELLATION:
        return this.translocoService.translate('BUTTONS.ASKED_FOR_CANCELLATION');
      case ReservationStatus.REJECTED_CANCELLATION:
        return this.translocoService.translate('STATUS.REJECTED_CANCELLATION');

      default:
        return '';
    }
  }

  readonly areAllSelected = computed(() => {
    const items = this.sortedReservations();
    if (items.length === 0) return false;
    const selected = this.store.toolbarSelectedIds();
    return items.every((res) => selected.has(res.id));
  });

  readonly isIndeterminate = computed(() => {
    const selectedSize = this.store.toolbarSelectedIds().size;
    return selectedSize > 0 && !this.areAllSelected();
  });

  toggleMasterCheckbox(): void {
    if (this.areAllSelected() || this.isIndeterminate()) {
      this.store.clearSelection();
    } else {
      const allIds = new Set(this.sortedReservations().map((res) => res.id));
      this.store.setSelectedIds(allIds);
    }
  }

  toggleSelection(id: number): void {
    this.store.toggleSelection(id);
  }

  constructor() {
    effect(() => this.initializeTable());
  }

  initializeTable() {
    const tableType = this.type();
    const loggedUser = this.auth.currentUser();
    const selectedUser = this.userStore.selectedUser();
    const currentStatus = this.status();

    if (tableType) {
      this.store.reservationTableType.set(tableType);
    }
    if (currentStatus) {
      this.store.reservationTableStatus.set(currentStatus);
    }

    const params = this.queryParams();
    const page = this.store.currentReservationsPage();
    const size = this.store.currentReservationsSize();
    const sortBy = this.store.currentSortBy();
    const sortDir = this.store.currentSortDir();
    const future = this.store.toolbarOnlyFuture();

    const sizeKey = this.store.reservationsSizeQueryParamName();
    const pageKey = this.store.reservationsPageQueryParamName();

    if (params[pageKey] === undefined || params[sizeKey] === undefined) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          [pageKey]: page,
          [sizeKey]: size,
          sortBy: sortBy,
          sortDir: sortDir,
          future: future ? 'true' : 'false',
        },
        queryParamsHandling: 'merge',
      });

      return;
    }

    switch (tableType) {
      case ReservationTableType.USER_PROFILE:
        if (loggedUser) {
          this.orgFacade.getOrganizations(true, loggedUser.id);
          this.facade.getReservations({
            future: future,
            userId: loggedUser.id,
          });
        }
        break;

      case ReservationTableType.ADMIN_BY_STATUS:
        this.store.toolbarType.set(ToolbarType.RESERVATIONS);
        if (this.auth.isAdmin()) {
          this.orgFacade.getOrganizations(true, null);
        }
        if (currentStatus) {
          this.facade.getReservations({
            statuses:
              currentStatus === ReservationStatus.CONFIRMED ||
              currentStatus === ReservationStatus.CREATED
                ? new Set<ReservationStatus>([
                    currentStatus,
                    ReservationStatus.REJECTED_CANCELLATION,
                  ])
                : new Set<ReservationStatus>([currentStatus]),
            future: future,
          });
        }
        break;

      case ReservationTableType.ADMIN_ORG_DETAILS:
        this.store.toolbarType.set(ToolbarType.RESERVATIONS);
        const selectedOrg = this.orgStore.selectedOrganization();
        if (selectedOrg) {
          this.facade.getReservations({
            future: future,
            organizationIds: new Set([selectedOrg.id]),
          });
        }
        break;

      case ReservationTableType.ADMIN_USER_DETAILS:
        this.store.toolbarType.set(ToolbarType.RESERVATIONS);
        if (currentStatus && selectedUser) {
          this.facade.getReservations({
            statuses: new Set<ReservationStatus>([currentStatus]),
            future: future,
            userId: selectedUser.id,
          });
        }
        break;
    }
  }

  toggleSort(column: string): void {
    const isCurrentlySortedByThis = this.store.currentSortBy() === column;
    const nextDir =
      isCurrentlySortedByThis && this.store.currentSortDir() === 'asc' ? 'desc' : 'asc';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sortBy: column,
        sortDir: nextDir,
        page: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  openReservationDetails(res: ReservationDto): void {
    this.store.selectedReservation.set(res);

    if (
      this.type() === ReservationTableType.ADMIN_BY_STATUS ||
      this.type() === ReservationTableType.USER_PROFILE
    ) {
      const idSet = new Set<number>();
      idSet.add(res.id);
      this.store.toolbarSelectedIds.set(idSet);
      this.viewStore.isReservationDetailsModalActive.set(true);
    }
  }
}
