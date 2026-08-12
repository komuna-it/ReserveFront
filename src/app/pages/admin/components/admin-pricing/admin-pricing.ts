import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationType } from '../../../../model/reservationType';
import { Room } from '../../../../model/room';
import { AddRoomModal } from '../../../../modals/add-room-modal/add-room-modal';

@Component({
  selector: 'app-admin-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule, AddRoomModal],
  templateUrl: './admin-pricing.html',
})
export class AdminPricing implements OnInit {
  readonly facade = inject(ReservationFacade);
  readonly store = inject(ReservationStore);
  readonly ResType = ReservationType;

  ngOnInit(): void {
    this.facade.getRooms();
  }

  toggleRecordable(roomId: number, currentStatus: boolean): void {
    this.facade.isRoomRecordable(roomId, !currentStatus);
  }

  savePrice(roomId: number, type: ReservationType, price: number): void {
    this.facade.postPriceForRoomId(roomId, type, Number(price) || 0);
  }

  isSaving(roomId: number, type: ReservationType): boolean {
    const loading = this.store.pricingLoadingState();
    return loading?.roomId === roomId && loading?.type === type;
  }

  getPrice(room: Room, type: ReservationType): number {
    if (!room?.pricing) return 0;

    if (Array.isArray(room.pricing)) {
      return room.pricing.find((p) => p.reservationType === type)?.price ?? 0;
    }

    return (room.pricing as Record<string, number>)[type] ?? 0;
  }

  handleCreateRoom() {
    this.store.isModalAddRoomActive.set(true);
  }
}
