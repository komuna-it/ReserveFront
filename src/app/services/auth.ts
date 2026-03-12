import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root' 
})
export class AuthService {
  
  private userSubject = new BehaviorSubject<User | null>(null);

  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
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

register(email: string, password: string) {
  return this.http.post<User>(
    `${environment.apiUrl}/register`,
    { email, password }
  );
}

}