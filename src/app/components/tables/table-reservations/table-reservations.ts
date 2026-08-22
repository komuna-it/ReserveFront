import { Component, computed, effect, inject, input } from '@angular/core';
import { ReservationStatus } from '../../../model/reservationStatus';
import { ReservationDto } from '../../../model/reservationDto';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { ReservationStore } from '../../reservation/reservation.store';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextFormatingTool } from '../../../tools/textFormatingTool';
import { CalendarHelper } from '../../calendar/calendar.helper';
import { CommonModule } from '@angular/common';
import { Pagination } from '../../../layout/pagination/pagination';
import { ReservationTableType } from '../../../model/reservationTableType';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ToolbarType } from '../../toolbars/toolbarType';
import { toSignal } from '@angular/core/rxjs-interop';
import { TableToolbar } from '../../toolbars/table-toolbar/table-toolbar';
import { AuthService } from '../../../auth/authService';
import { of } from 'rxjs';

@Component({
  selector: 'app-table-reservations',
  imports: [TranslocoPipe, CommonModule, Pagination],
  templateUrl: './table-reservations.html',
})
export class TableReservations {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly translocoService = inject(TranslocoService);
  readonly textFormatingTool = inject(TextFormatingTool);
  readonly calendarHelper = inject(CalendarHelper);
  readonly ReservationStatus = ReservationStatus;
  readonly ReservationTableType = ReservationTableType;
  readonly type = input<ReservationTableType>();
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  readonly status = input<ReservationStatus | null>();
  readonly toolbarType = input<ToolbarType | null>();

  readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Params });

  isCancellationPossible(res: ReservationDto): boolean {
    if (
      res.status === ReservationStatus.REQUESTED_CANCELLATION ||
      res.status === ReservationStatus.CANCELLED
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

      default:
        return '';
    }
  }

  // BY STATUS checkbox-ing

  readonly areAllSelected = computed(() => {
    const items = this.store.reservations();
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
      const allIds = new Set(this.store.reservations().map((res) => res.id));
      this.store.setSelectedIds(allIds);
    }
  }

  toggleSelection(id: number): void {
    this.store.toggleSelection(id);
  }

  constructor() {
    const loggedUser = this.auth.currentUser();

    if (this.auth.isAdmin()) {
      this.facade.getOrganizations(true, null);
    } else if (loggedUser) {
      this.facade.getOrganizations(false, loggedUser.id);
    }

    effect(() => this.initializeTable());
  }

  initializeTable() {
    const tableType = this.type();
    const loggedUser = this.auth.currentUser();
    const selectedUser = this.store.selectedUser();
    const currentStatus = this.status();

    if (tableType == null) return;
    // console.log('res table: tableType ', tableType);

    switch (tableType) {
      case ReservationTableType.USER_PROFILE:
        if (loggedUser) this.facade.getReservations(null, false, loggedUser.id, null, null, null);
        break;

      case ReservationTableType.ADMIN_BY_STATUS:
        this.store.toolbarType.set(ToolbarType.RESERVATIONS);
        if (currentStatus)
          this.facade.getReservations(
            new Set<ReservationStatus>([currentStatus]),
            this.store.toolbarOnlyFuture(),
            null,
            null,
            null,
            null,
          );
        break;

      case ReservationTableType.ADMIN_ORG_DETAILS:
        this.store.toolbarType.set(ToolbarType.RESERVATIONS);
        const selectedOrg = this.store.selectedOrganization();
        if (selectedOrg)
          this.facade.getReservations(
            null,
            this.store.toolbarOnlyFuture(),
            null,
            new Set([selectedOrg.id]),
            null,
            null,
          );
        break;

      case ReservationTableType.ADMIN_USER_DETAILS:
        this.store.toolbarType.set(ToolbarType.RESERVATIONS);
        if (currentStatus && selectedUser)
          this.facade.getReservations(
            new Set<ReservationStatus>([currentStatus]),
            this.store.toolbarOnlyFuture(),
            selectedUser.id,
            null,
            null,
            null,
          );
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
    if (this.type() === ReservationTableType.ADMIN_BY_STATUS) {
      const idSet = new Set<number>();
      idSet.add(res.id);
      this.store.toolbarSelectedIds.set(idSet);

      this.store.isReservationDetailsModalActive.set(true);
    }
  }
}
