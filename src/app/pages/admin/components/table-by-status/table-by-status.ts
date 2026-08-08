import { Component, computed, effect, HostListener, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { ReservationStatus } from '../../../../model/reservationStatus';
import { ReservationDto } from '../../../../model/reservationDto';
import { TextFormatingTool } from '../../../../tools/textFormatingTool';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-table-by-status',
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './table-by-status.html',
  styleUrl: './table-by-status.css',
})
export class TableByStatus {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly textFormatingTool = inject(TextFormatingTool);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly status = input<ReservationStatus | null>(null);
  readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Params });

  // ========= checkbox-ing

  readonly areAllSelected = computed(() => {
    const items = this.store.reservationsByStatus();
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
      const allIds = new Set(this.store.reservationsByStatus().map((res) => res.id));
      this.store.setSelectedIds(allIds);
    }
  }

  toggleSelection(id: number): void {
    this.store.toggleSelection(id);
  }

  // ======= Sorting

  constructor() {
    effect(() => {
      const currentStatus = this.status();
      if (!currentStatus) return;

      // Accessing computed signals registers dependencies
      this.store.currentSortBy();
      this.store.currentSortDir();
      this.store.paginationPage();
      this.store.paginationSize();

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

  readonly currentSortBy = computed(() => this.queryParams()['sortBy'] ?? 'startAt');
  readonly currentSortDir = computed(
    () => (this.queryParams()['sortDir'] as 'asc' | 'desc') ?? 'desc',
  );
}
