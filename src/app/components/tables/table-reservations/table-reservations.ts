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
  readonly type = input.required<ReservationTableType>();
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly status = input<ReservationStatus | null>();
  readonly toolbarType = input<ToolbarType | null>();

  readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Params });

  deleteReservation(reservationId: number) {
    console.log(`Trying to delete reservation with id ${reservationId}`);
    this.facade.deleteReservation(reservationId);
    this.facade.getAllReservationsForUserAndTheirOrganization();
  }

  isCancellationPossible(res: ReservationDto): boolean {
    if (
      res.status === ReservationStatus.CANCELLED ||
      res.status === ReservationStatus.REJECTED ||
      res.status === ReservationStatus.REQUESTED_CANCELLATION
    ) {
      return false;
    }

    return !this.isTooLateToCancel(res);
  }

  isTooLateToCancel(res: ReservationDto) {
    const startDate = new Date(res.startAt);
    const now = new Date();
    const timeDifference = startDate.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    return hoursDifference <= 24;
  }

  getCancelButtonLabel(res: ReservationDto): string {
    if (this.isTooLateToCancel(res)) {
      return this.translocoService.translate('BUTTONS.TOO_LATE_TO_CANCEL');
    }
    switch (res.status) {
      case ReservationStatus.CREATED:
        return this.translocoService.translate('BUTTONS.REQUEST_CANCEL');
      case ReservationStatus.CONFIRMED:
        return this.translocoService.translate('BUTTONS.REQUEST_CANCEL');
      case ReservationStatus.CANCELLED:
        return this.translocoService.translate('BUTTONS.CANCELLATION_NOT_POSSIBLE');
      case ReservationStatus.REJECTED:
        return this.translocoService.translate('BUTTONS.CANCELLATION_NOT_POSSIBLE');
      case ReservationStatus.REQUESTED_CANCELLATION:
        return this.translocoService.translate('BUTTONS.CANCELLATION_NOT_POSSIBLE');

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

  // BY STATUS SORTING

  constructor() {
    this.store.toolbarType.set(ToolbarType.RESERVATION_BY_STATUS);

    effect(() => {
      const currentStatus = this.status();

      this.store.currentSortBy();
      this.store.currentSortDir();
      this.store.currentReservationsPage();
      this.store.currentReservationsSize();

      if (this.type() === ReservationTableType.USER_PROFILE) {
        this.facade.getAllReservationsForUserAndTheirOrganization();
      }

      if (!currentStatus) return;
      this.store.statusForAdminPage.set(currentStatus);
      this.facade.getReservationsByStatus(currentStatus);
    });
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
}
