import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Observable, tap, of, map, firstValueFrom } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private cookieService = inject(CookieService);
  private router = inject(Router);

  private apiUrl = process.env['VSF_API_URL'] || '';

  private isAuthenticatedSignal = signal<boolean>(this.hasValidToken());
  readonly accessToken = signal<string>(this.getAccessToken() || '');
  readonly refreshToken = signal<string>(this.cookieService.get('refresh_token') || '');
  readonly authResponse = signal<AuthResponse | null>(null);
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly email = signal<string | null>(this.getEmail());
  readonly isAdmin = signal<boolean>(true);

  readonly userId = computed<string | null>(() => {
    const token = this.accessToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.sub;
    } catch (error) {
      console.error('Błąd podczas dekodowania tokenu w computed:', error);
      return null;
    }
  });
  readonly loginEndpoint = `${this.apiUrl}/auth/login`;
  readonly registerEndpoint = `${this.apiUrl}/auth/register`;

  login(email: string, password: string, rememberMe: boolean): Observable<AuthResponse> {
    // Prod
    return this.http.post<AuthResponse>(this.loginEndpoint, { email, password }).pipe(
      tap((response) => {
        this.email.set(email);
        console.log('Login response received: ', response);
        this.authResponse.set(response);
        this.handleAuthentication(response, rememberMe, email);
      }),
    );
  }

  async register(email: string, password: string, nick: string): Promise<string> {
    this.accessToken.set('');
    try {
      console.log('Sending registration request to endpoint:', this.registerEndpoint);
      console.log('Registration request payload:', { email, password, nick });
      const response = await firstValueFrom(
        this.http.post<{ accessToken: string }>(this.registerEndpoint, { email, password, nick }),
      );
      console.log('Registration response received: ', response);
      console.log('Access token from registration response: ', response.accessToken);
      this.accessToken.set(response.accessToken);
      this.login(email, password, true).subscribe({
        next: (loginResponse) => {
          console.log('Login after registration successful, response: ', loginResponse);
        },
      });
      return response.accessToken;
    } catch (err: any) {
      console.error('Register error caught:', err);
      throw err;
    }
  }

  private handleAuthentication(response: AuthResponse, rememberMe: boolean, email: string) {
    let accessExpiry: Date | undefined = undefined;
    let refreshExpiry: Date | undefined = undefined;

    if (rememberMe) {
      accessExpiry = new Date();
      accessExpiry.setMinutes(accessExpiry.getMinutes() + 60); // 60 mins

      refreshExpiry = new Date();
      refreshExpiry.setDate(refreshExpiry.getDate() + 10); // 10 days
    }

    this.accessToken.set(response.accessToken);
    this.refreshToken.set(response.refreshToken);
    const isSecure = window.location.protocol === 'https:';
    const sameSite = isSecure ? 'Strict' : 'Lax';
    this.cookieService.set(
      'access_token',
      response.accessToken,
      accessExpiry,
      '/',
      undefined,
      isSecure,
      sameSite,
    );

    this.cookieService.set(
      'refresh_token',
      response.refreshToken,
      refreshExpiry,
      '/',
      undefined,
      isSecure,
      sameSite,
    );

    this.cookieService.set(
      'user_id',
      this.userId() || '0',
      refreshExpiry,
      '/',
      undefined,
      isSecure,
      sameSite,
    );
    this.cookieService.set(
      'email',
      email || '0',
      refreshExpiry,
      '/',
      undefined,
      isSecure,
      sameSite,
    );
    console.log('setting authenticated true');
    console.log('cookies user_id: ' + this.cookieService.get('user_id'));
    this.isAuthenticatedSignal.set(true);
  }

  public getAccessToken(): string {
    return this.cookieService.get('access_token');
  }
  public getEmail(): string {
    return this.cookieService.get('email');
  }
  public getUserIdFromToken(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.sub;
    } catch (error) {
      console.error('Błąd podczas dekodowania tokenu:', error);
      return null;
    }
  }

  public logout() {
    // this.utils.resetState();
    this.cookieService.delete('access_token', '/');
    this.cookieService.delete('refresh_token', '/');
    this.cookieService.delete('user_id', '/');
    this.isAuthenticatedSignal.set(false);
    this.authResponse.set(null);
    this.router.navigate(['/']);
  }

  private hasValidToken(): boolean {
    return this.cookieService.check('access_token');
  }
}
