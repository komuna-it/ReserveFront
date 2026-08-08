import { Routes } from '@angular/router';
import { ReservationStatus } from '../model/reservationStatus';

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
      import('../pages/admin/components/reservations-by-status/reservations-by-status').then(
        (m) => m.ReservationsByStatus,
      ),
    data: { status: ReservationStatus.CONFIRMED },
  },
  {
    path: 'pending',
    loadComponent: () =>
      import('../pages/admin/components/reservations-by-status/reservations-by-status').then(
        (m) => m.ReservationsByStatus,
      ),
    data: { status: ReservationStatus.CREATED },
  },
  {
    path: 'cancelled',
    loadComponent: () =>
      import('../pages/admin/components/reservations-by-status/reservations-by-status').then(
        (m) => m.ReservationsByStatus,
      ),
    data: { status: ReservationStatus.CANCELLED },
  },
  {
    path: 'request-cancellation',
    loadComponent: () =>
      import('../pages/admin/components/reservations-by-status/reservations-by-status').then(
        (m) => m.ReservationsByStatus,
      ),
    data: { status: ReservationStatus.REQUESTED_CANCELLATION },
  },
  {
    path: 'rejected',
    loadComponent: () =>
      import('../pages/admin/components/reservations-by-status/reservations-by-status').then(
        (m) => m.ReservationsByStatus,
      ),
    data: { status: ReservationStatus.REJECTED },
  },
];
