import { Routes } from '@angular/router';
import { ReservationStatus } from '../model/reservationStatus';
import { ReservationTableType } from '../model/reservationTableType';
import { TableReservations } from '../components/tables/table-reservations/table-reservations';
import { ToolbarType } from '../components/toolbars/toolbarType';

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
    data: {
      status: ReservationStatus.CONFIRMED,
      type: ReservationTableType.ADMIN_BY_STATUS,
      toolbarType: ToolbarType.RESERVATION_BY_STATUS,
    },
  },
  {
    path: 'pending',
    loadComponent: () =>
      import('../pages/admin/components/reservations-by-status/reservations-by-status').then(
        (m) => m.ReservationsByStatus,
      ),
    data: {
      status: ReservationStatus.CREATED,
      type: ReservationTableType.ADMIN_BY_STATUS,
      toolbarType: ToolbarType.RESERVATION_BY_STATUS,
    },
  },
  {
    path: 'cancelled',
    loadComponent: () =>
      import('../pages/admin/components/reservations-by-status/reservations-by-status').then(
        (m) => m.ReservationsByStatus,
      ),
    data: {
      status: ReservationStatus.CANCELLED,
      type: ReservationTableType.ADMIN_BY_STATUS,
      toolbarType: ToolbarType.RESERVATION_BY_STATUS,
    },
  },
  {
    path: 'request-cancellation',
    loadComponent: () =>
      import('../pages/admin/components/reservations-by-status/reservations-by-status').then(
        (m) => m.ReservationsByStatus,
      ),
    data: {
      status: ReservationStatus.REQUESTED_CANCELLATION,
      type: ReservationTableType.ADMIN_BY_STATUS,
      toolbarType: ToolbarType.RESERVATION_BY_STATUS,
    },
  },
  {
    path: 'rejected',
    loadComponent: () =>
      import('../pages/admin/components/reservations-by-status/reservations-by-status').then(
        (m) => m.ReservationsByStatus,
      ),
    data: {
      status: ReservationStatus.REJECTED,
      type: ReservationTableType.ADMIN_BY_STATUS,
      toolbarType: ToolbarType.RESERVATION_BY_STATUS,
    },
  },
];
