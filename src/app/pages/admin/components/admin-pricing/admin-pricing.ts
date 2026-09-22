import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationType } from '../../../../model/reservationType';
import { Room } from '../../../../model/room';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-admin-pricing',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './admin-pricing.html',
})
export class AdminPricing implements OnInit {
  readonly facade = inject(ReservationFacade);
  readonly store = inject(ReservationStore);
  readonly ResType = ReservationType;

  // Key: "roomId-type" (e.g., "1-REHEARSAL"), Value: Update Object
  readonly pendingChanges = signal<
    Map<string, { roomId: number; type: ReservationType; price: number }>
  >(new Map());
  isSavingPrices = false;

  ngOnInit(): void {
    this.facade.getRooms();
  }

  // Called every time an input value changes
  onPriceChange(room: Room, type: ReservationType, newValueStr: string): void {
    const originalPrice = this.getOriginalPrice(room, type);
    const newPrice = Number(newValueStr);
    const key = `${room.id}-${type}`;

    // Update the signal map
    this.pendingChanges.update((map) => {
      const updatedMap = new Map(map);

      if (newPrice !== originalPrice && !isNaN(newPrice)) {
        // Value changed: add or update it in the map
        updatedMap.set(key, { roomId: room.id, type, price: newPrice });
      } else {
        // Value reverted to original: remove it from the map
        updatedMap.delete(key);
      }

      return updatedMap;
    });
  }

  getOriginalPrice(room: Room, type: ReservationType): number {
    if (!room?.pricing) return 0;
    if (Array.isArray(room.pricing)) {
      return room.pricing.find((p) => p.reservationType === type)?.price ?? 0;
    }
    return (room.pricing as Record<string, number>)[type] ?? 0;
  }

  saveChanges(): void {
    const updates = Array.from(this.pendingChanges().values());
    if (updates.length === 0) return;

    this.isSavingPrices = true;
    this.facade.saveMultiplePrices(updates, () => {
      this.isSavingPrices = false;
      this.pendingChanges.set(new Map()); // Clear pending changes on success
    });
  }

  toggleRecordable(roomId: number, currentStatus: boolean): void {
    this.facade.isRoomRecordable(roomId, !currentStatus);
  }

  handleCreateRoom() {
    this.store.isModalAddRoomActive.set(true);
  }
}
