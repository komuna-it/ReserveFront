import { Routes } from '@angular/router';

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
];
