import { Component, computed, effect, inject, input } from '@angular/core';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { CalendarHelper } from '../../components/calendar/calendar.helper';
import { TranslocoPipe } from '@jsverse/transloco';
import { TextFormatingTool } from '../../tools/textFormatingTool';
import { ReservationStatus } from '../../model/reservationStatus';
import { User } from '../../model/user';
import { UserReservations } from '../../pages/admin/components/user-reservations/user-reservations';
import { AuthService } from '../../auth/authService';

@Component({
  selector: 'app-user-details-modal',
  imports: [TranslocoPipe, UserReservations],
  templateUrl: './user-details-modal.html',
  styleUrl: './user-details-modal.css',
})
export class UserDetailsModal {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly helper = inject(CalendarHelper);
  readonly tool = inject(TextFormatingTool);
  readonly auth = inject(AuthService);
  readonly ReservationStatus = ReservationStatus;
  readonly textFormatingTool = inject(TextFormatingTool);

  readonly user = input.required<User | null>();

  constructor() {
    effect(() => {
      const currentUser = this.user();

      if (currentUser) {
        this.facade.getAllReservationsForUserAndTheirOrganizationsByUser(currentUser);
        this.facade.getOrganizationsOfUser(true, currentUser.id);
      }
      console.table(currentUser);
    });
  }
}
