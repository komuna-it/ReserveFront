import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { Router } from '@angular/router';

export interface UserStatus {
  id: number;
  email: string;
  role: string;
  trusted: false;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = process.env['VSF_API_URL'] || '/api';

  private currentUserSignal = signal<UserStatus | null>(null);
  private isLoadingSignal = signal<boolean>(true);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly userId = computed(() =>
    this.currentUserSignal()?.id ? String(this.currentUserSignal()?.id) : null,
  );
  readonly email = computed(() => this.currentUserSignal()?.email || null);

  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');

  constructor() {
    this.checkCurrentSession().subscribe();
  }

  login(email: string, password: string, rememberMe: boolean): Observable<UserStatus> {
    return this.http
      .post<UserStatus>(`${this.apiUrl}/auth/login`, { email, password, rememberMe })
      .pipe(tap((user) => this.currentUserSignal.set(user)));
  }

  register(email: string, password: string, name: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/register`, { email, password, name });
  }

  checkCurrentSession(): Observable<boolean> {
    this.isLoadingSignal.set(true);
    return this.http.get<UserStatus>(`${this.apiUrl}/auth/me`).pipe(
      map((user) => {
        console.log('AuthService: Refreshed session user:', user);
        this.currentUserSignal.set(user);
        this.isLoadingSignal.set(false);
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

  logout() {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => this.executeLocalLogout(),
      error: () => this.executeLocalLogout(),
    });
  }

  private executeLocalLogout() {
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }
}
