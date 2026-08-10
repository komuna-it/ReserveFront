import { Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { ActivatedRoute } from '@angular/router';
import { ToolbarType } from '../../components/toolbars/toolbarType';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationType } from '../../model/reservationType';
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  readonly totalElements = input.required<number>();
  readonly currentPage = input.required<number>();
  readonly store = inject(ReservationStore);
  readonly pageSize = input<number>(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  readonly pageChange = output<number>();
  readonly sizeChange = output<number>();

  readonly totalPages = input.required<number>();

  readonly isFirst = computed(() => this.currentPage() <= 0);
  readonly isLast = computed(() => this.currentPage() >= this.totalPages() - 1);

  onPrevious(): void {
    if (!this.isFirst()) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  onNext(): void {
    if (!this.isLast()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }

  onSizeSelect(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newSize = Number(selectElement.value);

    if (!isNaN(newSize) && newSize > 0) {
      this.sizeChange.emit(newSize);
    }
  }
}
