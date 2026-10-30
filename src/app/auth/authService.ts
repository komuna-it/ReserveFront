import { Injectable, signal, inject, computed, isDevMode } from '@angular/core';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  tap,
  catchError,
  of,
  map,
  throwError,
  firstValueFrom,
  finalize,
  switchMap,
} from 'rxjs';

import { Router } from '@angular/router';
import { User } from '../model/user';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly translocoService = inject(TranslocoService);

  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isLoadingSignal = signal<boolean>(true);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  readonly userId = computed(() => {
    const id = this.currentUserSignal()?.id;
    return id ? String(id) : null;
  });

  readonly email = computed(() => this.currentUserSignal()?.email || null);

  readonly isAdmin = computed(() => {
    const role = this.currentUserSignal()?.role;
    return role === 'ADMIN' || role === 'MANAGER';
  });

  readonly isManager = computed(() => this.currentUserSignal()?.role === 'MANAGER');

  readonly isConfirmingEmail = signal<boolean>(false);

  private readonly apiUrl = environment.apiUrl;

  private refreshTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (isDevMode()) {
      console.log('AuthService apiUrl:', this.apiUrl);
    }
  }

  // -------------------------------------------------------
  // APPLICATION INITIALIZATION
  // -------------------------------------------------------

  initialize(): Promise<void> {
    return firstValueFrom(this.checkCurrentSession()).then(() => undefined);
  }

  checkCurrentSession(): Observable<boolean> {
    this.isLoadingSignal.set(true);

    if (isDevMode()) {
      console.log('Checking current session...');
    }

    const getCurrentUser = () =>
      this.http.get<User | null>(`${this.apiUrl}/auth/me`, {
        withCredentials: true,
      });

    return getCurrentUser().pipe(
      catchError((error: HttpErrorResponse) => {
        // 401 is expected when the user is anonymous  or when the access token has expired.
        if (error.status !== 401) {
          return throwError(() => error);
        }

        // Try refreshing the session in case the access token  expired but the refresh token is still valid.
        return this.refreshToken().pipe(
          switchMap(() => getCurrentUser()),

          catchError((refreshError: HttpErrorResponse) => {
            // No valid refresh token means anonymous session.
            if (refreshError.status === 401) {
              return of(null);
            }

            return throwError(() => refreshError);
          }),
        );
      }),

      tap((user) => {
        if (user) {
          this.setAuthenticatedUser(user);

          if (isDevMode()) {
            console.log('Session restored:', user);
          }
        } else {
          this.clearSessionState();

          if (isDevMode()) {
            console.log('No active session. Continuing as anonymous user.');
          }
        }
      }),

      map((user) => user !== null),

      catchError((error: unknown) => {
        // Do not log expected authentication failures.
        if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
          console.error('Error checking current session:', error);
        }

        this.clearSessionState();
        return of(false);
      }),

      finalize(() => {
        this.isLoadingSignal.set(false);

        if (isDevMode()) {
          console.log('Session initialization finished.');
        }
      }),
    );
  }

  // -------------------------------------------------------
  // SESSION MANAGEMENT
  // -------------------------------------------------------

  private setAuthenticatedUser(user: User): void {
    this.currentUserSignal.set(user);

    if (user.preferredLanguage) {
      this.translocoService.setActiveLang(user.preferredLanguage);
    }

    if (user.accessTokenExpiresAt) {
      this.setupRefreshTimer(user.accessTokenExpiresAt);
    }
  }

  private clearSessionState(): void {
    this.currentUserSignal.set(null);

    if (this.refreshTimeout !== null) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  private navigateAfterLogout(): void {
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/confirm-email',
      '/forgot-password',
      '/contact',
      '/calendar',
    ];

    const currentUrl = this.router.url.split('?')[0];

    if (!publicRoutes.includes(currentUrl)) {
      void this.router.navigate(['/']);
    }
  }

  executeLocalLogout(): void {
    this.clearSessionState();
    this.navigateAfterLogout();
  }

  // Called by the interceptor when refresh fails.
  // Avoid navigation while the application initializer is running.
  handleSessionExpired(): void {
    this.clearSessionState();

    if (!this.isLoadingSignal()) {
      this.navigateAfterLogout();
    }
  }

  handleUserBanned(_reason?: string): void {
    this.executeLocalLogout();
  }

  logout(): void {
    this.http
      .post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        finalize(() => {
          this.executeLocalLogout();
        }),
      )
      .subscribe({
        error: (error: HttpErrorResponse) => {
          if (error.status !== 401) {
            console.error('Logout request failed:', error);
          }
        },
      });
  }

  // -------------------------------------------------------
  // TOKEN REFRESH
  // -------------------------------------------------------

  private setupRefreshTimer(expiresAtMillis: number): void {
    if (this.refreshTimeout !== null) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }

    // Refresh 10 seconds before access-token expiration.
    const delay = Math.max(0, expiresAtMillis - Date.now() - 10_000);

    if (isDevMode()) {
      console.log(`Next token refresh in ${Math.round(delay / 1000)} seconds.`);
    }

    this.refreshTimeout = setTimeout(() => {
      this.refreshToken().subscribe({
        error: (error: HttpErrorResponse) => {
          // 401 means the refresh token is no longer valid.
          if (error.status !== 401) {
            console.error('Scheduled token refresh failed:', error);
          }

          this.handleSessionExpired();
        },
      });
    }, delay);
  }

  refreshToken(): Observable<{ accessTokenExpiresAt: number }> {
    return this.http
      .post<{
        accessTokenExpiresAt: number;
      }>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response?.accessTokenExpiresAt) {
            this.setupRefreshTimer(response.accessTokenExpiresAt);

            if (isDevMode()) {
              console.info('Token refreshed. New expiration:', response.accessTokenExpiresAt);
            }
          }
        }),
      );
  }

  // -------------------------------------------------------
  // LOGIN / REGISTER
  // -------------------------------------------------------

  login(email: string, password: string, rememberMe: boolean): Observable<User> {
    return this.http
      .post<User>(
        `${this.apiUrl}/auth/login`,
        { email, password, rememberMe },
        { withCredentials: true },
      )
      .pipe(
        tap((user) => {
          this.setAuthenticatedUser(user);
        }),
      );
  }

  register(email: string, password: string, name: string, language: string): Observable<User> {
    return this.http.post<User>(
      `${this.apiUrl}/auth/register`,
      {
        email,
        password,
        name,
        preferredLanguage: language,
      },
      { withCredentials: true },
    );
  }

  // -------------------------------------------------------
  // USER PREFERENCES
  // -------------------------------------------------------

  updateUserLanguage(lang: string): void {
    this.currentUserSignal.update((user) => (user ? { ...user, preferredLanguage: lang } : null));
  }

  // -------------------------------------------------------
  // PASSWORD MANAGEMENT
  // -------------------------------------------------------

  handleForgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/forgotPassword`, { email });
  }

  handleUpdatePassword(currentPassword: string, newPassword: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/updatePassword`, {
      currentPassword,
      newPassword,
    });
  }

  // -------------------------------------------------------
  // EMAIL CONFIRMATION
  // -------------------------------------------------------

  confirmEmail(verificationToken: string): Observable<void> {
    this.isConfirmingEmail.set(true);

    return this.http.get<void>(`${this.apiUrl}/auth/confirmEmail/${verificationToken}`).pipe(
      finalize(() => {
        this.isConfirmingEmail.set(false);
      }),
    );
  }
}
