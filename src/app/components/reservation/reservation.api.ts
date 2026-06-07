import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { Room } from '../../model/room';
import { ReservationDto } from '../../model/reservationDto';
import { Organization } from '../../model/organization';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReservationApi {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = process.env['VSF_API_URL'] || '';

  get authHeader(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.accessToken()}` });
  }

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/room/all`, { headers: this.authHeader });
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

  getFutureReservations(): Observable<ReservationDto[]> {
    return this.http.get<ReservationDto[]>(`${this.apiUrl}/reservation/future`, {
      headers: this.authHeader,
    });
  }

  getOrganizationsOfUser(): Observable<Organization[]> {
    return this.http.get<Organization[]>(
      `${this.apiUrl}/organizationUser/user/${this.authService.userId()}/allOrganizations`,
      { headers: this.authHeader },
    );
  }

  getAllOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.apiUrl}/organization/`, {
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
}
