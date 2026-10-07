import { Component, HostListener, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ReservationStore } from '../../services/reservation/reservation.store';
import { ReservationFacade } from '../../services/reservation/reservation.facade';
import { ViewStore } from '../../services/view/view.store';
import { ViewController } from '../../services/view/view.controller';
import { ErrorType } from '../../model/error/errorType';

@Component({
  selector: 'app-add-room-modal',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './add-room-modal.html',
})
export class AddRoomModal {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);

  isRecordable = false;

  @HostListener('document:keydown.escape')
  onKeydownHandler(): void {
    this.viewController.closeModals();
  }

  createRoom(name: string): void {
    const trimmedName = name?.trim();
    if (!trimmedName) return;

    try {
      this.facade.postRoom(trimmedName);
      this.viewController.closeModals();
      this.viewController.showSuccess('ROOM_CREATED');
    } catch (error) {
      console.error('Error creating room:', error);
      this.viewController.showError(ErrorType.ROOM_CREATION_FAILED);
    }
  }
}
