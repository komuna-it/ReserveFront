import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';

@Component({
  selector: 'app-ban-modal',
  imports: [FormsModule, TranslocoPipe],
  templateUrl: './ban-modal.html',
  styleUrl: './ban-modal.css',
})
export class BanModal {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);

  readonly userIds = this.store.toolbarSelectedIds();

  readonly qtyOfUsersToBan = this.userIds.size;
  readonly users = this.store.allUsers().filter((u) => this.userIds.has(u.id));

  durationInput = '';
  reason = '';

  handleBan(): void {
    if (!this.reason || !this.durationInput) return;

    const duration = `P${this.durationInput}D`;
    this.store.banDuration.set(duration);
    this.store.banReason.set(this.reason);
    this.facade.banUsers();
  }
}
