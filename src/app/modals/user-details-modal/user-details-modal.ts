import { Component, computed, effect, inject, input } from '@angular/core';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { CalendarHelper } from '../../components/calendar/calendar.helper';
import { TranslocoPipe } from '@jsverse/transloco';
import { TextFormatingTool } from '../../tools/textFormatingTool';
import { ReservationStatus } from '../../model/reservationStatus';
import { User } from '../../model/user';
import { AuthService } from '../../auth/authService';
import { TableReservations } from '../../components/tables/table-reservations/table-reservations';
import { ReservationTableType } from '../../model/reservationTableType';

@Component({
  selector: 'app-user-details-modal',
  imports: [TranslocoPipe, TableReservations],
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
  readonly resTableType = ReservationTableType.ADMIN_USER_DETAILS;

  constructor() {
    const currentUser = this.store.selectedUser();

    effect(() => {
      if (currentUser) {
        console.log('UserDetailsModal Getting all reservations for user: ', currentUser.id);
        this.facade.getReservations({
          future: this.store.toolbarOnlyFuture(),
          userId: currentUser.id,
        });
        console.log('UserDetailsModal Getting all organizations for user: ', currentUser.id);
        this.facade.getOrganizations(false, currentUser.id);
      }
      console.table(currentUser);
    });
  }
}
