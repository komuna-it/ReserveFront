import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { CalendarPage } from './pages/calendar/calendar';
import { ContactPage } from './pages/contact/contact';
import { LoginPage } from './pages/login/login';
import { RegisterPage } from './pages/register/register';
import { ProfilePage } from './pages/profile/profile';
import { AdminPage } from './pages/admin/admin';
import { AdminCalendar } from './pages/admin/components/calendar/admin-calendar';
import { authGuard } from './auth-guard';
import { AdminOrganizations } from './pages/admin/components/admin-organizations/admin-organizations';
import { AdminPricing } from './pages/admin/components/admin-pricing/admin-pricing';

export const routes: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then((m) => m.ProfilePage),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then((m) => m.AdminPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'reservations',
        component: AdminCalendar,
      },
      {
        path: 'pricing',
        component: AdminPricing,
      },
      {
        path: 'organizations',
        component: AdminOrganizations,
      },
      { path: '', redirectTo: 'reservations', pathMatch: 'full' },
    ],
  },
  { path: '', component: HomePage },
  { path: 'calendar', component: CalendarPage },
  { path: 'contact', component: ContactPage },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'profile', component: ProfilePage },
  { path: 'admin', component: AdminPage },
];
