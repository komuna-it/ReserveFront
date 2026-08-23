import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './layout/navbar/navbar';
import { CookieBarComponent } from './layout/cookie-bar/cookie-bar';
import { ReservationStore } from './components/reservation/reservation.store';
import { ReservationFacade } from './components/reservation/reservation.facade';
import { ErrorPopup } from './modals/error-popup/error-popup';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, CookieBarComponent, ErrorPopup],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
}
