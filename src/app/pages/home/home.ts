import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { TranslocoModule, TranslocoPipe } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoPipe, TranslocoModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomePage {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly selectedImage = signal<string | null>(null);

  ngOnInit() {
    this.facade.getRooms();
  }

  getImagesForRoom(roomName: string): string[] {
    const folder = roomName
      .toLowerCase()
      .replace('ł', 'l')
      .replace('ś', 's')
      .replace('ą', 'a')
      .replace('ę', 'e')
      .replace('ć', 'c')
      .replace('ż', 'z');
    return [
      `assets/images/${folder}/${folder}-1.jpeg`,
      `assets/images/${folder}/${folder}-2.jpeg`,
      `assets/images/${folder}/${folder}-3.jpeg`,
    ];
  }

  scrollToRoom(roomId: number) {
    const element = document.getElementById(`room-${roomId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
