import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { Router } from '@angular/router';
import { User } from '../model/user';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private translocoService = inject(TranslocoService);
  private currentUserSignal = signal<User | null>(null);
  private isLoadingSignal = signal<boolean>(true);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  readonly userId = computed(() =>
    this.currentUserSignal()?.id ? String(this.currentUserSignal()?.id) : null,
  );
  readonly email = computed(() => this.currentUserSignal()?.email || null);

  readonly isAdmin = computed(() => {
    return (
      this.currentUserSignal()?.role === 'ADMIN' || this.currentUserSignal()?.role === 'MANAGER'
    );
  });
  private apiUrl =
    (process.env as any)['VSF_API_URL'] ||
    (process.env as any)['NG_APP_VSF_API_URL'] ||
    'https://api.vipsound.lmt.technology';
  constructor() {
    this.checkCurrentSession().subscribe();
    console.log('AuthService apiUrl: ', this.apiUrl);
  }

  login(email: string, password: string, rememberMe: boolean): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}/auth/login`, { email, password, rememberMe })
      .pipe(tap((user) => this.currentUserSignal.set(user)));
  }

  register(email: string, password: string, name: string, language: string): Observable<User> {
    console.log('auth register: language: ', language);
    return this.http.post<User>(`${this.apiUrl}/auth/register`, {
      email,
      password,
      name,
      preferredLanguage: language,
    });
  }

  checkCurrentSession(): Observable<boolean> {
    this.isLoadingSignal.set(true);
    console.log('checking current session');
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      map((user) => {
        console.log('AuthService: Refreshed session user:', user);
        this.currentUserSignal.set(user);
        this.isLoadingSignal.set(false);
        console.log('checking current session done');
        if (user.preferredLanguage) {
          this.translocoService.setActiveLang(user.preferredLanguage);
        }
        return true;
      }),
      catchError((e) => {
        console.error('Error checking current session:', e);
        this.currentUserSignal.set(null);
        this.isLoadingSignal.set(false);
        return of(false);
      }),
    );
  }

  handleUserBanned(reason?: string): void {
    this.currentUserSignal.set(null);
  }

  logout() {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => this.executeLocalLogout(),
      error: () => this.executeLocalLogout(),
    });
  }

  private executeLocalLogout() {
    this.currentUserSignal.set(null);

    const publicRoutes = ['/', '/login', '/register'];
    const currentUrl = this.router.url.split('?')[0];

    if (!publicRoutes.includes(currentUrl)) {
      this.router.navigate(['/']);
    }
  }

  refreshToken(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/refresh`, {});
  }

  handleSessionExpired() {
    this.executeLocalLogout();
  }

  updateUserLanguage(lang: string) {
    this.currentUserSignal.update((user) => (user ? { ...user, preferredLanguage: lang } : null));
  }

  handleForgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/forgotPassword`, { email: email });
  }

  handleUpdatePassword(currentPassword: string, newPassword: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/updatePassword`, {
      currentPassword: currentPassword,
      newPassword: newPassword,
    });
  }
}
