import { Component, HostListener, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';

@Component({
  selector: 'app-add-room-modal',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './add-room-modal.html',
  styleUrl: './add-room-modal.css',
})
export class AddRoomModal {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);

  isRecordable = false;

  @HostListener('document:keydown.escape')
  onKeydownHandler(): void {
    this.facade.closeModals();
  }

  createRoom(name: string): void {
    const trimmedName = name?.trim();
    if (!trimmedName) return;

    try {
      this.facade.postRoom(trimmedName);
      this.facade.closeModals();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  }
}
