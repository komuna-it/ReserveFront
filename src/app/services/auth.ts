import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Observable, tap, of, map } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

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

  private apiUrl = process.env['VSF_API_URL'] || '';

  private isAuthenticatedSignal = signal<boolean>(this.hasValidToken());
  public isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  readonly loginEndpoint = `${this.apiUrl}/auth/login`;
  readonly registerEndpoint = `${this.apiUrl}/auth/register`;

  login(email: string, password: string): Observable<void> {
    //   Prod
    //   return this.http.post<AuthResponse>(this.loginEndpoint, { email, password }).pipe(
    //     tap(response => this.handleAuthentication(response))
    //   );

    // Test
    const resp: AuthResponse = {
      accessToken: 'aaaaaaaaaaaaaaaaaaa',
      refreshToken: 'bbbbbbbbbbbbbbbbbbbbbbbb',
    };

    return of(resp).pipe(
      tap((response) => this.handleAuthentication(response)),
      map(() => void 0),
    );
  }

  async register(email: string, password: string): Promise<string> {
    try {
      // Prod
      // const response = await firstValueFrom(
      //   this.http.post<{ email: string }>(this.registerEndpoint, { email, password }),
      // );
      // return response.email;

      // Test
      const response = JSON.parse(`{ "email" : "mtroja98@gmail.com" }`);
      return response.email;
    } catch (err: any) {
      console.error('Register error caught:', err);
      throw err;
    }
  }

  private handleAuthentication(response: AuthResponse) {
    const accessExpiry = new Date();
    accessExpiry.setMinutes(accessExpiry.getMinutes() + 2);

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 10);

    this.cookieService.set(
      'access_token',
      response.accessToken,
      accessExpiry,
      '/',
      undefined,
      true,
      'Strict',
    );

    this.cookieService.set(
      'refresh_token',
      response.refreshToken,
      refreshExpiry,
      '/',
      undefined,
      true,
      'Strict',
    );

    this.cookieService.set('user_id', '1', refreshExpiry, '/', undefined, true, 'Strict');

    console.log('setting authenticated true');
    this.isAuthenticatedSignal.set(true);
    console.log('isAuthenticated after login:', this.isAuthenticated());
  }

  public getAccessToken(): string {
    return this.cookieService.get('access_token');
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
    this.cookieService.delete('access_token', '/');
    this.cookieService.delete('refresh_token', '/');
    this.cookieService.delete('user_id', '/');
    this.isAuthenticatedSignal.set(false);
  }

  private hasValidToken(): boolean {
    return this.cookieService.check('access_token');
  }
}
