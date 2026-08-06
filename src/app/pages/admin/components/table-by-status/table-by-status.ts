import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { ReservationStatus } from '../../../../model/reservationStatus';
import { ReservationDto } from '../../../../model/reservationDto';
import { TextFormatingTool } from '../../../../tools/textFormatingTool';

@Component({
  selector: 'app-table-by-status',
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './table-by-status.html',
  styleUrl: './table-by-status.css',
})
export class TableByStatus {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly translocoService = inject(TranslocoService);
  readonly textFormatingTool = inject(TextFormatingTool);

  readonly status = input<ReservationStatus | null>(null);

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
}
