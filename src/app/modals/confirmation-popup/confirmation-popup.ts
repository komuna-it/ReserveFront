import { Component, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-confirmation-popup',
  imports: [TranslocoPipe],
  templateUrl: './confirmation-popup.html',
  styleUrl: './confirmation-popup.css',
})
export class ConfirmationPopup {
  readonly titleText = input.required<string>();
  readonly bodyText = input<string>('');

  readonly ok = output<void>();
  readonly cancel = output<void | null>();

  handleOk() {
    this.ok.emit();
  }

  handleCancel() {
    this.cancel.emit();
  }
}
