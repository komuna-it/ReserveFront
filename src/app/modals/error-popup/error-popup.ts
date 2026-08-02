import { Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationFacade } from '../../components/reservation/reservation.facade';

@Component({
  selector: 'app-error-popup',
  imports: [TranslocoPipe],
  templateUrl: './error-popup.html',
  styleUrl: './error-popup.css',
})
export class ErrorPopup {
  readonly facade = inject(ReservationFacade);
  readonly titleText = input.required<string>();
  readonly bodyText = input<string>('');
  readonly ok = output<void>();
  readonly cancel = output<void | null>();
}
