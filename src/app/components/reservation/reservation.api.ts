import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../auth/authService';
import { Room } from '../../model/room';
import { ReservationDto } from '../../model/reservationDto';
import { Organization } from '../../model/organization';
import { Observable } from 'rxjs';
import { User } from '../../model/user';

@Injectable({ providedIn: 'root' })
export class ReservationApi {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = process.env['VSF_API_URL'] || '/api';

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/room`);
  }

  getReservationsByRoom(roomId: number): Observable<ReservationDto[]> {
    return this.http.get<ReservationDto[]>(`${this.apiUrl}/reservation/room/${roomId}`);
  }

  getReservationsForAllUsersOrganizations(): Observable<ReservationDto[]> {
    return this.http.get<ReservationDto[]>(
      `${this.apiUrl}/reservation/user/${this.authService.userId()}/organizations`,
    );
  }

  getReservations(): Observable<ReservationDto[]> {
    return this.http.get<ReservationDto[]>(`${this.apiUrl}/reservation`);
  }

  getFutureReservations(): Observable<ReservationDto[]> {
    const params = new HttpParams().set('future', 'true');
    return this.http.get<ReservationDto[]>(`${this.apiUrl}/reservation`, { params });
  }

  getOrganizationsOfUserWithMembers(): Observable<Organization[]> {
    const params = new HttpParams()
      .set('userId', this.authService.userId() ?? '0')
      .set('fetchMembers', 'true');
    return this.http.get<Organization[]>(`${this.apiUrl}/organization`, { params });
  }

  getAllOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.apiUrl}/organization`);
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reservation/${id}`);
  }

  postReservation(payload: any): Observable<ReservationDto> {
    return this.http.post<ReservationDto>(`${this.apiUrl}/reservation`, payload);
  }

  getMembersOfOrganization(organizationId: number): Observable<User[]> {
    const params = new HttpParams()
      .set('organizationId', organizationId)
      .set('fetchMembers', 'true');
    return this.http.get<User[]>(`${this.apiUrl}/organization`, { params });
  }

  getAllMembersAllOrganizations(): Observable<Organization[]> {
    const params = new HttpParams().set('fetchMembers', 'true');
    return this.http.get<Organization[]>(`${this.apiUrl}/organization`, { params });
  }

  getUserByEmail(email: string): Observable<User[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<User[]>(`${this.apiUrl}/user`, { params });
  }

  getAllReservationsForUserAndTheirOrganization(userId: number): Observable<ReservationDto[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<ReservationDto[]>(`${this.apiUrl}/reservation`, { params });
  }

  getTestText(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/users/test`);
  }

  createOrganization(name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/organization`, { name });
  }
}
