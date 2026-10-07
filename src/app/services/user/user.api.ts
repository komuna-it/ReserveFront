import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../model/user';
import { Page } from '../../model/page';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getUserByEmail(email: string): Observable<User[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<User[]>(`${this.apiUrl}/user`, { params });
  }

  getAllUsers(page: number, size: number, sort: string) {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<User>>(`${this.apiUrl}/users/all`, { params });
  }

  markUsersTrusted(usersIds: Set<number>) {
    return this.http.patch<User>(`${this.apiUrl}/users/trustedStatus`, {
      usersIds: Array.from(usersIds),
      trusted: true,
    });
  }

  markUsersUntrusted(usersIds: Set<number>) {
    return this.http.patch<User>(`${this.apiUrl}/users/trustedStatus`, {
      usersIds: Array.from(usersIds),
      trusted: false,
    });
  }

  unbanUsers(userIds: Set<number>) {
    return this.http.put(`${this.apiUrl}/users/unban`, { userIds: Array.from(userIds) });
  }

  banUsers(userIds: Set<number>, reason: string, duration: string) {
    return this.http.put(`${this.apiUrl}/users/ban`, {
      userIds: Array.from(userIds),
      reason,
      duration,
    });
  }

  promoteUserToAdmin(userId: number): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/assigneUser/${userId}/role/ADMIN`, {});
  }

  demoteAdminToUser(userId: number): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/assigneUser/${userId}/role/USER`, {});
  }

  setPreferredLanguage(language: string) {
    return this.http.patch<User>(`${this.apiUrl}/users/preferredLanguage/${language}`, {});
  }
}
