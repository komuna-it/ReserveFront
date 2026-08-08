import { Component, effect, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [FormsModule, TranslocoPipe],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  readonly store = inject(ReservationStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly totalElements = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly currentPage = input.required<number>();
  readonly isFirst = input.required<boolean>();
  readonly isLast = input.required<boolean>();

  readonly pageSizeOptions = input<number[]>([5, 10, 20, 50]);

  readonly previous = output<void>();
  readonly next = output<void>();
  readonly sizeChange = output<number>();

  onSizeChange(newSize: number | string): void {
    const size = Number(newSize);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        size: newSize,
      },
      queryParamsHandling: 'merge',
    });

    if (!isNaN(size) && size > 0) {
      this.sizeChange.emit(size);
    }
  }
}
