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
    path: 'forgot-password',
    loadComponent: () =>
      import('../pages/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile.routes').then((m) => m.PROFILE_ROUTES),
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
