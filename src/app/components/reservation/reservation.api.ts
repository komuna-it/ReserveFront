import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { Room } from '../../model/room';
import { ReservationDto } from '../../model/reservationDto';
import { Organization } from '../../model/organization';
import { Observable } from 'rxjs';
import { User } from '../../model/user';

@Injectable({ providedIn: 'root' })
export class ReservationApi {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = process.env['VSF_API_URL'] || '';

  get authHeader(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });
  }

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/room`, { headers: this.authHeader });
  }

  getReservationsByRoom(roomId: number): Observable<ReservationDto[]> {
    return this.http.get<ReservationDto[]>(`${this.apiUrl}/reservation/room/${roomId}`, {
      headers: this.authHeader,
    });
  }

  getReservationsForAllUsersOrganizations(): Observable<ReservationDto[]> {
    return this.http.get<ReservationDto[]>(
      `${this.apiUrl}/reservation/user/${this.authService.userId()}/organizations`,
      { headers: this.authHeader },
    );
  }

  getReservations(): Observable<ReservationDto[]> {
    return this.http.get<ReservationDto[]>(`${this.apiUrl}/reservation`, {
      headers: this.authHeader,
    });
  }
  getFutureReservations(): Observable<ReservationDto[]> {
    let params = new HttpParams().set('future', 'true');
    return this.http.get<ReservationDto[]>(`${this.apiUrl}/reservation`, {
      headers: this.authHeader,
      params: params,
    });
  }
  getOrganizationsOfUser(): Observable<Organization[]> {
    let params: HttpParams = new HttpParams()
      .set('userId', this.authService.userId() ?? '0')
      .set('fetchMembers', false);
    return this.http.get<Organization[]>(`${this.apiUrl}/organization`, {
      headers: this.authHeader,
      params: params,
    });
  }

  getAllOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.apiUrl}/organization`, {
      headers: this.authHeader,
    });
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reservation/${id}`, { headers: this.authHeader });
  }

  postReservation(payload: any): Observable<ReservationDto> {
    return this.http.post<ReservationDto>(`${this.apiUrl}/reservation`, payload, {
      headers: this.authHeader,
    });
  }
  getMembersOfOrganization(organizationId: number) {
    let params: HttpParams = new HttpParams();
    params.set('organizationId', organizationId);
    params.set('fetchMembers', true);

    return this.http.get<User[]>(`${process.env['VSF_API_URL'] || ''}/organization`, {
      headers: this.authHeader,
      params: params,
    });
  }
  getAllMembersAllOrganizations() {
    const params = new HttpParams().set('fetchMembers', 'true');

    return this.http.get<Organization[]>(`${process.env['VSF_API_URL'] || ''}/organization`, {
      headers: this.authHeader,
      params: params,
    });
  }
  getUserByEmail(email: string) {
    const params = new HttpParams().set('email', email);
    return this.http.get<User[]>(`${process.env['VSF_API_URL'] || ''}/user`, {
      headers: this.authHeader,
      params: params,
    });
  }
  getAllReservationsForUserAndTheirOrganization(userId: number) {
    let params = new HttpParams().set('userId', userId);
    return this.http.get<ReservationDto[]>(`${this.apiUrl}/reservation`, {
      headers: this.authHeader,
      params: params,
    });
  }
  createOrganization(name: string) {
    return this.http.post(
      `${this.apiUrl}/organization`,
      { name: name },
      { headers: this.authHeader },
    );
  }
}
