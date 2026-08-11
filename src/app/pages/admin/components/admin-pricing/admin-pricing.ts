import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationType } from '../../../../model/reservationType';
import { Room } from '../../../../model/room';

interface RoomPriceRow {
  roomId: number;
  roomName: string;
  recordingPrice: number;
  rehearsalPrice: number;
  isSavingRecording: boolean;
  isSavingRehearsal: boolean;
}

@Component({
  selector: 'app-admin-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-pricing.html',
  styleUrl: './admin-pricing.css',
})
export class AdminPricing implements OnInit {
  readonly facade = inject(ReservationFacade);
  readonly store = inject(ReservationStore);

  readonly ResType = ReservationType;

  editablePrices = signal<Map<number, { recording: number; rehearsal: number }>>(new Map());

  readonly roomPriceRows = computed(() => {
    const rooms = this.store.rooms();
    const editable = this.editablePrices();
    const loadingState = this.store.pricingLoadingState();

    return rooms.map((room) => {
      const currentEditable = editable.get(room.id);
      const defaultRecording = this.getPriceFromRoom(room, ReservationType.RECORDING);
      const defaultRehearsal = this.getPriceFromRoom(room, ReservationType.REHEARSAL);

      return {
        roomId: room.id,
        roomName: room.name,
        recordingPrice: currentEditable ? currentEditable.recording : defaultRecording,
        rehearsalPrice: currentEditable ? currentEditable.rehearsal : defaultRehearsal,
        isSavingRecording:
          loadingState?.roomId === room.id && loadingState?.type === ReservationType.RECORDING,
        isSavingRehearsal:
          loadingState?.roomId === room.id && loadingState?.type === ReservationType.REHEARSAL,
      };
    });
  });

  isLoading = this.store.isLoadingRooms;

  ngOnInit(): void {
    this.facade.getRooms();
  }

  onPriceChange(roomId: number, type: ReservationType, value: number): void {
    this.editablePrices.update((map) => {
      const newMap = new Map(map);
      const current = newMap.get(roomId) || this.getCurrentStorePrices(roomId);

      newMap.set(roomId, {
        ...current,
        [type === ReservationType.RECORDING ? 'recording' : 'rehearsal']: value,
      });

      return newMap;
    });
  }

  savePrice(roomId: number, type: ReservationType): void {
    const editable = this.editablePrices().get(roomId) || this.getCurrentStorePrices(roomId);

    const priceToSave =
      type === ReservationType.RECORDING ? editable.recording : editable.rehearsal;

    // Poprawiona nazwa metody
    this.facade.postPriceForRoomId(roomId, type, priceToSave);
  }

  private getPriceFromRoom(room: Room | undefined, type: ReservationType): number {
    return room?.pricing?.find((p) => p.reservationType === type)?.price ?? 0;
  }

  private getCurrentStorePrices(roomId: number): { recording: number; rehearsal: number } {
    const room = this.store.rooms().find((r) => r.id === roomId);
    return {
      recording: this.getPriceFromRoom(room, ReservationType.RECORDING),
      rehearsal: this.getPriceFromRoom(room, ReservationType.REHEARSAL),
    };
  }
}
