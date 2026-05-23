import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private authData = signal<AuthResponse | null>(null);
  readonly currentAuthData = this.authData.asReadonly();

  readonly isLoggedIn = computed(() => !!this.authData());
  readonly email = signal<String | null>(localStorage.getItem('auth_email'));

  readonly token = computed(() => this.authData()?.accessToken ?? null);
  readonly loginEndpoint = `${environment.apiUrl}/auth/login`;
  readonly registerEndpoint = `${environment.apiUrl}/auth/register`;

  constructor() {
    const saved = localStorage.getItem('auth_data');
    if (saved) {
      try {
        this.authData.set(JSON.parse(saved));
      } catch (e) {
        this.logout();
      }
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Prod
      // const response = await firstValueFrom(
      //   this.http.post<AuthResponse>(this.loginEndpoint, { email, password }),
      // );

      // Test
      const resp = ` 
      { "accessToken" : "aaaaaaaaaaaaaaaaaaa",
      "refreshToken" : "bbbbbbbbbbbbbbbbbbbbbbbb"} 
      `;
      const response = JSON.parse(resp);
      this.setAuth(response);
      this.email.set(email);
      localStorage.setItem('auth_email', email);
      return response;
    } catch (err: any) {
      console.error('Login error caught:', err);
      throw err;
    }
  }

  async register(email: string, password: string): Promise<String> {
    try {
      // Prod
      // const response = await firstValueFrom(
      //   this.http.post<AuthResponse>(this.registerEndpoint, { email, password }),
      // );

      // Test
      const response = JSON.parse(` 
        { "email" : "mtroja98@gmail.com" }`);
      this.setAuth(response);
      return response;
    } catch (err: any) {
      console.error('Register error caught:', err);
      throw err;
    }
  }

  logout() {
    this.authData.set(null);
    this.email.set(null);
    localStorage.removeItem('auth_data');
    localStorage.removeItem('auth_email');
  }

  private setAuth(data: AuthResponse) {
    this.authData.set(data);
    localStorage.setItem('auth_data', JSON.stringify(data));
  }
}
