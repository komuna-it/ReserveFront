import { Component, inject } from '@angular/core';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';

@Component({
  selector: 'app-admin-pricing',
  imports: [],
  templateUrl: './admin-pricing.html',
  styleUrl: './admin-pricing.css',
})
export class AdminPricing {
  readonly facade = inject(ReservationFacade);

  testText = this.facade.getTestText();
}
