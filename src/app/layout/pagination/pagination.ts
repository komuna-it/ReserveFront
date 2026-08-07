import { Component, inject, input, OnInit, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [FormsModule, TranslocoPipe],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination implements OnInit {
  readonly transloco = inject(TranslocoService);
  readonly store = inject(ReservationStore);

  readonly totalElements = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly currentPage = input.required<number>();
  readonly isFirst = input.required<boolean>();
  readonly isLast = input.required<boolean>();

  readonly previous = output<void>();
  readonly next = output<void>();
  readonly sizeChange = output<number>();

  ngOnInit(): void {
    if (this.store.paginationSize() === 0) {
      this.store.paginationSize.set(10);
    }
  }

  onSizeChange(newSize: number | string): void {
    const size = Number(newSize);
    this.store.paginationSize.set(size);
    this.store.paginationPage.set(0);
    this.sizeChange.emit(size);
  }
}
