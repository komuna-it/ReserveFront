import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'reservations',
    pathMatch: 'full',
  },
  {
    path: 'reservations',
    loadComponent: () =>
      import('../components/tables/table-reservations-user/table-reservations-user').then(
        (m) => m.TableReservationsUser,
      ),
    // data: { status: ReservationStatus.CONFIRMED },
  },
  {
    path: 'organizations',
    loadComponent: () =>
      import('../pages/admin/components/organization-list/organization-list').then(
        (m) => m.OrganizationList,
      ),
    // data: { status: ReservationStatus.CREATED },
  },
];
