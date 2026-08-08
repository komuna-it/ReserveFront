import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../auth/authService';
import { Room } from '../../model/room';
import { ReservationDto } from '../../model/reservationDto';
import { Organization } from '../../model/organization';
import { Observable, map } from 'rxjs';
import { User } from '../../model/user';
import { Page } from '../../model/page';
import { ReservationStatus } from '../../model/reservationStatus';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReservationApi {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = process.env['VSF_API_URL'] || '/api';

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/rooms`);
  }

  getReservationsByRoom(
    roomId: number,
    page: number,
    size: number,
  ): Observable<Page<ReservationDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<ReservationDto>>(`${this.apiUrl}/reservations/room/${roomId}`, {
      params,
    });
  }

  getReservationsForAllUsersOrganizations(
    page: number,
    size: number,
  ): Observable<Page<ReservationDto>> {
    const rawUserId = (this.authService.userId() || '').toString().replace(/['"]/g, '');
    const params = new HttpParams().set('page', page).set('size', size);

    return this.http.get<Page<ReservationDto>>(
      `${this.apiUrl}/reservation/user/${rawUserId}/organizations`,
      { params },
    );
  }

  getReservations(page: number, size: number): Observable<Page<ReservationDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<ReservationDto>>(`${this.apiUrl}/reservations`, { params });
  }

  getAllReservationsForUserAndTheirOrganization(
    userId: number,
    page = 0,
    size = 100,
  ): Observable<Page<ReservationDto>> {
    const params = new HttpParams().set('userId', userId).set('page', page).set('size', size);
    return this.http.get<Page<ReservationDto>>(`${this.apiUrl}/reservations`, { params });
  }

  getFutureReservations(page: number, size: number): Observable<Page<ReservationDto>> {
    const params = new HttpParams().set('future', 'true').set('page', page).set('size', size);
    return this.http.get<Page<ReservationDto>>(`${this.apiUrl}/reservations`, { params });
  }

  getOrganizationsOfUserWithMembers(page: number, size: number): Observable<Page<Organization>> {
    let userId = this.authService.userId();
    if (userId) {
      userId = userId.toString().replace(/['"]/g, '');
    }

    const params = new HttpParams()
      .set('userId', userId ?? '')
      .set('fetchMembers', 'true')
      .set('page', page)
      .set('size', size);

    return this.http.get<Page<Organization>>(`${this.apiUrl}/organizations`, { params });
  }

  getAllOrganizations(page: number, size: number): Observable<Page<Organization>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Organization>>(`${this.apiUrl}/organizations`, { params });
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reservations/${id}`);
  }

  postReservation(payload: any): Observable<ReservationDto> {
    return this.http.post<ReservationDto>(`${this.apiUrl}/reservations`, payload);
  }

  getMembersAndOwnersOfOrganization(organizationId: number): Observable<User[]> {
    const params = new HttpParams()
      .set('organizationId', organizationId)
      .set('fetchMembers', 'true');
    return this.http.get<User[]>(`${this.apiUrl}/organizations`, { params });
  }

  getAllMembersAllOrganizations(page: number, size: number): Observable<Page<Organization>> {
    const params = new HttpParams().set('fetchMembers', 'true').set('page', page).set('size', size);
    return this.http.get<Page<Organization>>(`${this.apiUrl}/organizations`, { params });
  }

  getUserByEmail(email: string): Observable<User[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<User[]>(`${this.apiUrl}/user`, { params });
  }

  getTestText(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/users/test`);
  }

  createOrganization(name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/organizations`, { name });
  }

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

  markOrganizationsAsTrusted(organizationIds: Set<number>): Observable<Organization> {
    return this.http.patch<Organization>(
      `${this.apiUrl}/organizations/${organizationIds}/isTrusted/true`,
      {},
    );
  }

  markOrganizationsAsUntrusted(organizationIds: Set<number>): Observable<Organization> {
    return this.http.patch<Organization>(
      `${this.apiUrl}/organizations/${organizationIds}/isTrusted/false`,
      {},
    );
  }

  getAllUsers(page: number, size: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/all`);
  }
  markUsersTrusted(usersIds: Set<number>) {
    const userIdsArray = Array.from(usersIds);
    const trusted = true;
    return this.http.patch<User>(`${this.apiUrl}/users/trustedStatus`, {
      usersIds: userIdsArray,
      trusted,
    });
  }
  markUsersUntrusted(usersIds: Set<number>) {
    const userIdsArray = Array.from(usersIds);

    const trusted = false;
    return this.http.patch<User>(`${this.apiUrl}/users/trustedStatus`, {
      usersIds: userIdsArray,
      trusted,
    });
  }

  getReservationsByStatus(page: number, size: number, status: ReservationStatus, sort: string) {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('status', status)
      .set('sort', sort);
    return this.http.get<Page<ReservationDto>>(`${this.apiUrl}/reservations`, { params });
  }

  updateReservationsStatus(resIds: Set<number>, status: ReservationStatus) {
    const reservationIds = Array.from(resIds);

    switch (status) {
      case ReservationStatus.CONFIRMED:
        return this.http.post(`${this.apiUrl}/reservations/confirm`, { reservationIds });

      case ReservationStatus.REQUESTED_CANCELLATION:
        return this.http.post(`${this.apiUrl}/reservations/requestCancel`, { reservationIds });

      case ReservationStatus.CANCELLED:
        return this.http.post(`${this.apiUrl}/reservations/confirmCancel`, { reservationIds });

      case ReservationStatus.REJECTED:
        return this.http.post(`${this.apiUrl}/reservations/reject`, { reservationIds });

      case ReservationStatus.REJECTED_CANCELLATION:
        return this.http.post(`${this.apiUrl}/reservations/rejectCancel`, { reservationIds });

      default:
        console.error('Unsupported status:', status);
        return throwError(() => new Error(`Unsupported reservation status: ${status}`));
    }
  }

  unbanUsers(userIds: Set<number>) {
    const array = Array.from(userIds);

    return this.http.put(`${this.apiUrl}/users/unban`, { userIds: array });
  }

  banUsers(userIds: Set<number>, reason: string, duration: string) {
    const array = Array.from(userIds);
    return this.http.put(`${this.apiUrl}/users/ban`, { userIds: array, reason, duration });
  }
}
