import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Observable, tap, of, map, firstValueFrom } from 'rxjs';
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
  readonly accessToken = signal<string>(this.getAccessToken() || '');
  readonly refreshToken = signal<string>(this.cookieService.get('refresh_token') || '');
  readonly authResponse = signal<AuthResponse | null>(null);
  public isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly loginEndpoint = `${this.apiUrl}/auth/login`;
  readonly registerEndpoint = `${this.apiUrl}/auth/register`;

  login(email: string, password: string): Observable<AuthResponse> {
    // Prod
    return this.http.post<AuthResponse>(this.loginEndpoint, { email, password }).pipe(
      // 2. Use tap() for side-effects (saving state/cookies)
      tap((response) => {
        console.log('Login response received: ', response);
        this.authResponse.set(response);
        this.handleAuthentication(response);
      }),
    );

    // Test
    // const resp: AuthResponse = {
    //   accessToken: 'aaaaaaaaaaaaaaaaaaa',
    //   refreshToken: 'bbbbbbbbbbbbbbbbbbbbbbbb',
    // };
    // this.authResponse.set(resp);
    // this.handleAuthentication(resp);
  }

  async register(email: string, password: string, nick: string): Promise<string> {
    // Prod
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
      return response.accessToken;
    } catch (err: any) {
      console.error('Register error caught:', err);
      throw err;
    }

    // Test
    //   const response = JSON.parse(`{ "email" : "mtroja98@gmail.com" }`);
    //   return response.email;
    // } catch (err: any) {
    //   console.error('Register error caught:', err);
    //   throw err;
    // }
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
    this.accessToken.set(response.accessToken);
    this.refreshToken.set(response.refreshToken);
    console.log('isAuthenticated after login:', this.isAuthenticated());
    console.log('Access token set to:', this.accessToken());
    console.log('Refresh token set to:', this.refreshToken());
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
