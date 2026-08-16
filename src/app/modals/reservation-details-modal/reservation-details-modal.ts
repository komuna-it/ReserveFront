import { Component, computed, inject } from '@angular/core';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { CalendarHelper } from '../../components/calendar/calendar.helper';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextFormatingTool } from '../../tools/textFormatingTool';
import { ReservationStatus } from '../../model/reservationStatus';

import { AuthService } from '../../auth/authService';
import { ReservationDto } from '../../model/reservationDto';

@Component({
  selector: 'app-reservation-details-modal',
  imports: [TranslocoPipe],
  templateUrl: './reservation-details-modal.html',
  styleUrl: './reservation-details-modal.css',
})
export class ReservationDetailsModal {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly tool = inject(TextFormatingTool);
  readonly loco = inject(TranslocoService);
  readonly ReservationStatus = ReservationStatus;
  readonly helper = inject(CalendarHelper);

  readonly activeReservation = computed(() => {
    const explicitlySelected = this.store.selectedReservation();
    if (explicitlySelected) {
      return explicitlySelected;
    }

    const selectedIds = this.store.toolbarSelectedIds();
    if (selectedIds.size === 1) {
      const id = Array.from(selectedIds)[0];
      return this.store.reservations().find((r) => r.id === id) || null;
    }

    return null;
  });

  readonly reservationText = computed(() => {
    const res = this.activeReservation();
    if (!res) return '';

    return this.tool.reservedByText(res);
  });

  readonly reservedByUser = computed(() => {
    const res = this.activeReservation();
    if (!res) return null;

    const users = this.store.allUsers();
    if (Array.isArray(users)) {
      return users.find((u: any) => u.id === res.reservedBy) || null;
    }
    return null;
  });
}
