import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './layout/navbar/navbar';
import { CookieBarComponent } from './layout/cookie-bar/cookie-bar';
import { ReservationStore } from './services/reservation/reservation.store';
import { ReservationFacade } from './services/reservation/reservation.facade';
import { ErrorPopup } from './modals/error-popup/error-popup';
import { SuccessPopup } from './modals/success-popup/success-popup';
import { ConfirmationPopup } from './modals/confirmation-popup/confirmation-popup';
import { ViewController } from './services/view/view.controller';
import { ViewStore } from './services/view/view.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, CookieBarComponent, ErrorPopup, SuccessPopup, ConfirmationPopup],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  readonly reservationStore = inject(ReservationStore);
  readonly viewController = inject(ViewController);
  readonly viewStore = inject(ViewStore);
  readonly reservationFacade = inject(ReservationFacade);
}
