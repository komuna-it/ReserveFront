import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { CalendarPage } from './pages/calendar/calendar';
import { ContactPage } from './pages/contact/contact';
import { LoginPage } from './pages/login/login';
import { RegisterPage } from './pages/register/register';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'calendar', component: CalendarPage },
  { path: 'contact', component: ContactPage },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage }

];