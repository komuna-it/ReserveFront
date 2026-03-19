import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User } from '../model/user';
import { firstValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user = signal<User | null>(null);

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('user');
    if (saved) {
      this.user.set(JSON.parse(saved));
    }
  }

  async register(email: string, password: string): Promise<User> {
    try {
      const user = await firstValueFrom(
        this.http.post<User>(`${environment.apiUrl}/register`, { email, password })
      );
      this.user.set(user);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (err: any) {
      console.error('Register error caught in service:', err);
      throw err;
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const user = await firstValueFrom(
        this.http.post<User>(`${environment.apiUrl}/login`, { email, password })
      );
      this.user.set(user);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (err: any) {
      console.error('Login error caught in service:', err);
      throw err;
    }
  }
  logout() {
    this.user.set(null);
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!this.user();
  }

  getUser(): User | null {
    return this.user();
  }

  
}