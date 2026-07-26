import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../auth/authService';
import { Room } from '../../model/room';
import { ReservationDto } from '../../model/reservationDto';
import { Organization } from '../../model/organization';
import { Observable } from 'rxjs';
import { User } from '../../model/user';
import { Page } from '../../model/page';
import { OrganizationMemberDto } from '../../model/organizationMemberDto';

@Injectable({ providedIn: 'root' })
export class ReservationApi {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = process.env['VSF_API_URL'] || '/api';

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/rooms`);
  }

  getReservationsByRoom(roomId: number, page = 0, size = 100): Observable<Page<ReservationDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<ReservationDto>>(`${this.apiUrl}/reservations/room/${roomId}`, {
      params,
    });
  }

  getReservationsForAllUsersOrganizations(page = 0, size = 100): Observable<Page<ReservationDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<ReservationDto>>(
      `${this.apiUrl}/reservation/user/${this.authService.userId()}/organizations`,
      { params },
    );
  }

  getReservations(page = 0, size = 100): Observable<Page<ReservationDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<ReservationDto>>(`${this.apiUrl}/reservations`, { params });
  }

  getFutureReservations(page = 0, size = 100): Observable<Page<ReservationDto>> {
    const params = new HttpParams().set('future', 'true').set('page', page).set('size', size);
    return this.http.get<Page<ReservationDto>>(`${this.apiUrl}/reservations`, { params });
  }

  getOrganizationsOfUserWithMembers(page = 0, size = 20): Observable<Page<Organization>> {
    const params = new HttpParams()
      .set('userId', this.authService.userId() ?? '0')
      .set('fetchMembers', 'true')
      .set('page', page)
      .set('size', size);
    return this.http.get<Page<Organization>>(`${this.apiUrl}/organizations`, { params });
  }

  getAllOrganizations(page = 0, size = 20): Observable<Page<Organization>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Organization>>(`${this.apiUrl}/organizations`, { params });
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reservations/${id}`);
  }

  postReservation(payload: any): Observable<ReservationDto> {
    return this.http.post<ReservationDto>(`${this.apiUrl}/reservations`, payload);
  }

  getMembersOfOrganization(organizationId: number): Observable<User[]> {
    const params = new HttpParams()
      .set('organizationId', organizationId)
      .set('fetchMembers', 'true');
    return this.http.get<User[]>(`${this.apiUrl}/organizations`, { params });
  }

  getAllMembersAllOrganizations(page = 0, size = 20): Observable<Page<Organization>> {
    const params = new HttpParams().set('fetchMembers', 'true').set('page', page).set('size', size);
    return this.http.get<Page<Organization>>(`${this.apiUrl}/organizations`, { params });
  }

  getUserByEmail(email: string): Observable<User[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<User[]>(`${this.apiUrl}/user`, { params });
  }

  getAllReservationsForUserAndTheirOrganization(
    userId: number,
    page = 0,
    size = 100,
  ): Observable<Page<ReservationDto>> {
    const params = new HttpParams().set('userId', userId).set('page', page).set('size', size);
    return this.http.get<Page<ReservationDto>>(`${this.apiUrl}/reservations`, { params });
  }

  getTestText(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/users/test`);
  }

  createOrganization(name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/organizations`, { name });
  }

  // ======================= ORGS ========================

  removeOwnerFromOrganization(userId: number, organizationId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/organizations/assigneUser/${userId}/role/MEMBER/toOrganization/${organizationId}`,
      {},
    );
  }
  addOwnerIntoOrganization(userId: number, organizationId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/organizations/assigneUser/${userId}/role/OWNER/toOrganization/${organizationId}`,
      {},
    );
  }

  removeUserFromOrganization(id: number, organizationId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/organizations/removeMember/${id}/fromOrganization/${organizationId}`,
      {},
    );
  }

  addUserIntoOrganization(id: number, organizationId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/organizations/addMember/${id}/toOrganization/${organizationId}`,
      {},
    );
  }

  removeOrg(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/organizations/decommission/${id}`);
  }

  markOrganizationAsTrusted(organizationId: number, trusted: boolean): Observable<Organization> {
    return this.http.patch<Organization>(
      `${this.apiUrl}/organizations/${organizationId}/isTrusted/${trusted}`,
      {},
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/all`);
  }
}
