// src/app/services/auth.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: number;
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root' 
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);

  user$ = this.userSubject.asObservable();

  constructor() {
    const saved = localStorage.getItem('user');
    if (saved) {
      this.userSubject.next(JSON.parse(saved));
    }
  }

  login(user: User) {
    this.userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  logout() {
    this.userSubject.next(null);
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  getUser(): User | null {
    return this.userSubject.value;
  }
}