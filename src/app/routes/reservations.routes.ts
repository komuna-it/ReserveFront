import { Routes } from '@angular/router';
import { RequestCancellationReservationsComponent } from '../pages/admin/components/request-cancellation-reservations-component/request-cancellation-reservations-component';
import { RejectedReservations } from '../pages/admin/components/rejected-reservations/rejected-reservations';

export const RESERVATIONS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'calendar',
    pathMatch: 'full',
  },
  {
    path: 'calendar',
    loadComponent: () => import('../components/calendar/calendar').then((m) => m.CalendarComponent),
  },
  {
    path: 'confirmed',
    loadComponent: () =>
      import('../pages/admin/components/confirmed-reservations-component/confirmed-reservations-component').then(
        (m) => m.ConfirmedReservationsComponent,
      ),
  },
  {
    path: 'pending',
    loadComponent: () =>
      import('../pages/admin/components/pending-reservations-component/pending-reservations-component').then(
        (m) => m.PendingReservationsComponent,
      ),
  },
  {
    path: 'cancelled',
    loadComponent: () =>
      import('../pages/admin/components/cancelled-reservations-component/cancelled-reservations-component').then(
        (m) => m.CancelledReservationsComponent,
      ),
  },
  {
    path: 'request-cancellation',
    loadComponent: () =>
      import('../pages/admin/components/request-cancellation-reservations-component/request-cancellation-reservations-component').then(
        (m) => m.RequestCancellationReservationsComponent,
      ),
  },
  {
    path: 'rejected',
    loadComponent: () =>
      import('../pages/admin/components/rejected-reservations/rejected-reservations').then(
        (m) => m.RejectedReservations,
      ),
  },
];
