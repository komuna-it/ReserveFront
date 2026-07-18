import { Component, inject } from '@angular/core';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { ReservationStore } from '../../../../components/reservation/reservation.store';

@Component({
  selector: 'app-admin-pricing',
  imports: [],
  templateUrl: './admin-pricing.html',
  styleUrl: './admin-pricing.css',
})
export class AdminPricing {
  readonly facade = inject(ReservationFacade);
  readonly store = inject(ReservationStore);

  test = this.facade.getTestText();
  testText = this.store.testText.toString();
}
