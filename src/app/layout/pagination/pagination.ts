import { Component, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { ReservationStore } from '../../components/reservation/reservation.store';

@Component({
  selector: 'app-pagination',
  imports: [TranslocoPipe],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  readonly transloco = inject(TranslocoService);
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
}
