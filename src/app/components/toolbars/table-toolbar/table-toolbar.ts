import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ReservationStore } from '../../reservation/reservation.store';
import { ReservationFacade } from '../../reservation/reservation.facade';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { BanModal } from '../../../modals/ban-modal/ban-modal';
import { ToolbarType } from '../toolbarType';
import { SearchBar } from '../search-bar/search-bar';

@Component({
  selector: 'app-table-toolbar',
  imports: [SearchBar],
  templateUrl: './table-toolbar.html',
  styleUrl: './table-toolbar.css',
})
export class TableToolbar {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly type = input<ToolbarType | null>();
  readonly ToolbarType = ToolbarType;

  readonly selectedIds = computed(() => {
    switch (this.type()) {
      case ToolbarType.RESERVATION_BY_STATUS: {
        return this.store.reservationsByStatus();
      }
      case ToolbarType.USERS: {
        return this.store.allUsers();
      }
      default:
        return null;
    }
  });
}
