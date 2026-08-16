import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unauthenticated-modal',
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './unauthenticated-modal.html',
  styleUrl: './unauthenticated-modal.css',
})
export class UnauthenticatedModal {
  readonly facade = inject(ReservationFacade);
}
