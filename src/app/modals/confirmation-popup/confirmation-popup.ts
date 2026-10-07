import { Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReservationFacade } from '../../services/reservation/reservation.facade';
import { ViewStore } from '../../services/view/view.store';
import { ViewController } from '../../services/view/view.controller';

@Component({
  selector: 'app-confirmation-popup',
  imports: [TranslocoPipe],
  templateUrl: './confirmation-popup.html',
  styleUrl: './confirmation-popup.css',
})
export class ConfirmationPopup {
  readonly titleText = input.required<string>();
  readonly bodyText = input<string>('');
  readonly facade = inject(ReservationFacade);
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);

  readonly ok = output<void>();
  readonly cancel = output<void | null>();

  handleOk() {
    this.ok.emit();
  }

  handleCancel() {
    this.cancel.emit();
  }
}
