import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ReservationFacade } from '../../../services/reservation/reservation.facade';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ViewController } from '../../../services/view/view.controller';
import { ViewStore } from '../../../services/view/view.store';

@Component({
  selector: 'app-unauthenticated-modal',
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './unauthenticated-modal.html',
  styleUrl: './unauthenticated-modal.css',
})
export class UnauthenticatedModal {
  readonly facade = inject(ReservationFacade);
  readonly viewStore = inject(ViewStore);
  readonly viewController = inject(ViewController);
}
