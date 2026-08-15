import { Routes } from '@angular/router';
import { UserSettings } from '../components/user-settings/user-settings';
import { ReservationTableType } from '../model/reservationTableType';
import { UpdatePassword } from '../components/update-password/update-password';

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
          import('../components/tables/table-reservations/table-reservations').then(
            (m) => m.TableReservations,
          ),
        data: { type: ReservationTableType.USER_PROFILE },
      },
      {
        path: 'organizations',
        loadComponent: () =>
          import('../pages/admin/components/organization-list/organization-list').then(
            (m) => m.OrganizationList,
          ),
        data: { mode: 'user' },
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../components/user-settings/user-settings').then((m) => m.UserSettings),
      },
      {
        path: 'update-password',
        loadComponent: () =>
          import('../components/update-password/update-password').then((m) => m.UpdatePassword),
      },
    ],
  },
];
