import { Component, inject, input } from '@angular/core';
import { ReservationStore } from '../../reservation/reservation.store';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
})
export class SearchBar {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly query = '';

  onQueryChange(value: string) {
    this.store.searchBarQuery.set(value);
  }
}
