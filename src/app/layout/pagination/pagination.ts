import { Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-pagination',
  imports: [TranslocoPipe],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  readonly transloco = inject(TranslocoService);

  readonly totalElements = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly currentPage = input.required<number>();
  readonly isFirst = input.required<boolean>();
  readonly isLast = input.required<boolean>();

  readonly previous = output<void>();
  readonly next = output<void>();
}
