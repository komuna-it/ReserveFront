import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [FormsModule, TranslocoPipe],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  // Stan przekazywany z komponentu rodzica / Store
  readonly totalElements = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly currentPage = input.required<number>();
  readonly isFirst = input.required<boolean>();
  readonly isLast = input.required<boolean>();

  readonly pageSize = input<number>(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 20, 50]);

  readonly previous = output<void>();
  readonly next = output<void>();
  readonly sizeChange = output<number>();

  onSizeChange(newSize: number | string): void {
    const size = Number(newSize);
    if (!isNaN(size) && size > 0) {
      this.sizeChange.emit(size);
    }
  }
}
