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

  async login(email: string, password: string): Promise<User> {
    const user = await firstValueFrom(
      this.http.post<User>(`${environment.apiUrl}/login`, { email, password })
    );
    this.user.set(user);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

async register(email: string, password: string): Promise<User | null> {
  try {
    const user = await firstValueFrom(
      this.http.post<User>(`${environment.apiUrl}/register`, { email, password })
    );
    this.user.set(user);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error: any) {
    if (error.status === 400) {
      // handle duplicate email 
      console.error('Registration failed:', error.error.message);
      return null;
    } else {
      console.error('Unexpected error', error);
      throw error;
    }
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