import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/profile/profile').then((m) => m.ProfilePage),
    children: [
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
      },
      {
        path: 'organizations',
        loadComponent: () =>
          import('../pages/admin/components/organization-list/organization-list').then(
            (m) => m.OrganizationList,
          ),
        data: { mode: 'user' },
      },
    ],
  },
];
