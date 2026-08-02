import { Component, inject } from '@angular/core';
import { ReservationStore } from '../../reservation/reservation.store';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-table-toolbar',
  imports: [TranslocoPipe],
  templateUrl: './table-toolbar.html',
  styleUrl: './table-toolbar.css',
})
export class TableToolbar {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
}
