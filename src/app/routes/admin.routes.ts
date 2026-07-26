import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/admin/admin').then((m) => m.AdminPage),
    children: [
      {
        path: '',
        redirectTo: 'reservations',
        pathMatch: 'full',
      },
      {
        path: 'reservations',
        loadChildren: () => import('./reservations.routes').then((m) => m.RESERVATIONS_ROUTES),
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('../pages/admin/components/admin-pricing/admin-pricing').then(
            (m) => m.AdminPricing,
          ),
      },
      {
        path: 'organizations',
        loadComponent: () =>
          import('../pages/admin/components/organization-list/organization-list').then(
            (m) => m.OrganizationList,
          ),
      },
      {
        path: 'rooms',
        loadComponent: () => import('../pages/admin/components/rooms/rooms').then((m) => m.Rooms),
      },
    ],
  },
];
