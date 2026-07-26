import { Routes } from '@angular/router';
import { authenticatedGuard } from '../auth/authenticatedGuard';
import { adminGuard } from '../auth/adminGuard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/home/home').then((m) => m.HomePage),
  },
  {
    path: 'calendar',
    loadComponent: () => import('../pages/calendar/calendar').then((m) => m.CalendarPage),
  },
  {
    path: 'contact',
    loadComponent: () => import('../pages/contact/contact').then((m) => m.ContactPage),
  },
  {
    path: 'login',
    loadComponent: () => import('../pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('../pages/register/register').then((m) => m.RegisterPage),
  },
  {
    path: 'profile',
    loadComponent: () => import('../pages/profile/profile').then((m) => m.ProfilePage),
    canActivate: [authenticatedGuard],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
