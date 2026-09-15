import { Injectable, signal, inject, computed, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User } from '../model/user';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../environments/environment';

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
  private apiUrl = environment.apiUrl;
  private refreshTimeout: any;

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

  private setupRefreshTimer(expiresAtMillis: number) {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    const expiresIn = expiresAtMillis - Date.now();
    const timeToRefresh = expiresIn - 10000;

    if (timeToRefresh > 0) {
      this.refreshTimeout = setTimeout(() => {
        this.refreshToken().subscribe();
      }, timeToRefresh);
    } else {
      this.refreshToken().subscribe();
    }
  }

  checkCurrentSession(): Observable<boolean> {
    this.isLoadingSignal.set(true);
    if (isDevMode()) {
      console.log('apiUrl: ', environment.apiUrl);
      console.log('checking current session');
    }
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      map((user) => {
        if (isDevMode()) {
          console.log('AuthService: Refreshed session user:', user);
          console.log('checking current session done');
        }
        this.currentUserSignal.set(user);
        this.isLoadingSignal.set(false);

        if (user.preferredLanguage) {
          this.translocoService.setActiveLang(user.preferredLanguage);
        }

        if (user.accessTokenExpiresAt) {
          if (isDevMode()) {
            console.log('user.accessTokenExpiresAt: ', user.accessTokenExpiresAt);
          }
          this.setupRefreshTimer(user.accessTokenExpiresAt);
        }

        return true;
      }),
      catchError((e) => {
        console.error('Error checking current session:', e);
        this.executeLocalLogout();
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

    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }

    const publicRoutes = ['/', '/login', '/register', '/confirm-email', '/forgot-password'];
    const currentUrl = this.router.url.split('?')[0];

    if (!publicRoutes.includes(currentUrl)) {
      this.router.navigate(['/']);
    }
  }

  refreshToken(): Observable<{ accessTokenExpiresAt: number }> {
    return this.http.post<{ accessTokenExpiresAt: number }>(`${this.apiUrl}/auth/refresh`, {}).pipe(
      tap((response) => {
        if (response && response.accessTokenExpiresAt) {
          this.setupRefreshTimer(response.accessTokenExpiresAt);
          if (isDevMode()) {
            console.info('refreshed token, new expiration: ', response.accessTokenExpiresAt);
          }
        }
      }),
      catchError((error) => {
        console.error('failed to refresh token, logging out');
        this.executeLocalLogout();
        return throwError(() => error);
      }),
    );
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

  readonly isConfirmingEmail = signal<boolean>(false);

  confirmEmail(verificationToken: string): Observable<void> {
    this.isConfirmingEmail.set(true);

    return this.http.get<void>(`${this.apiUrl}/auth/confirmEmail/${verificationToken}`).pipe(
      tap(() => {
        this.isConfirmingEmail.set(false);
      }),
      catchError((error) => {
        this.isConfirmingEmail.set(false);
        return throwError(() => error);
      }),
    );
  }
}
