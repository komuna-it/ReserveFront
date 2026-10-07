import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ReservationFacade } from '../../../../services/reservation/reservation.facade';
import { ReservationStore } from '../../../../services/reservation/reservation.store';

@Component({
  selector: 'app-rooms',
  imports: [],
  templateUrl: './rooms.html',
  styleUrl: './rooms.css',
})
export class Rooms implements OnInit, OnDestroy {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);

  ngOnInit(): void {
    this.facade.getRooms();
  }
  ngOnDestroy(): void {
    this.store.rooms.set([]);
  }
}
