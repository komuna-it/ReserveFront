import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationStore } from '../../../../components/reservation/reservation.store';
import { ReservationFacade } from '../../../../components/reservation/reservation.facade';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Pagination } from '../../../../layout/pagination/pagination';
import { SuccessPopup } from '../../../../modals/success-popup/success-popup';
import { ErrorPopup } from '../../../../modals/error-popup/error-popup';
import { ConfirmationPopup } from '../../../../modals/confirmation-popup/confirmation-popup';
import { filter } from 'rxjs';

@Component({
  selector: 'app-users-table',
  imports: [CommonModule, TranslocoPipe, Pagination, SuccessPopup, ErrorPopup, ConfirmationPopup],
  templateUrl: './users-table.html',
  styleUrl: './users-table.css',
})
export class UsersTable {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);
  readonly loco = inject(TranslocoService);
}
