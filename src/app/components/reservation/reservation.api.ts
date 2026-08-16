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
import { OrganizationMemberDto } from '../../model/organizationMemberDto';
import { ReservationType } from '../../model/reservationType';

@Injectable({ providedIn: 'root' })
export class ReservationApi {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = process.env['VSF_API_URL'] || '/api';

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/rooms`);
  }

  postRoom(name: string) {
    return this.http.post<Room>(`${this.apiUrl}/rooms/create/${name}`, {});
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reservations/${id}`);
  }

  postReservation(payload: any): Observable<ReservationDto> {
    return this.http.post<ReservationDto>(`${this.apiUrl}/reservations`, payload);
  }

  postPriceForRoomId(roomId: number, resType: ReservationType, price: number) {
    return this.http.post<Room>(
      `${this.apiUrl}/rooms/${roomId}/setNewPrice/${resType}/${price}`,
      {},
    );
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

  promoteMemberToOwner(userId: number, organizationId: number): Observable<OrganizationMemberDto> {
    return this.http.patch<OrganizationMemberDto>(
      `${this.apiUrl}/organizations/assigneUser/${userId}/role/OWNER/toOrganization/${organizationId}`,
      {},
    );
  }

  demoteOwnerToMember(userId: number, organizationId: number): Observable<OrganizationMemberDto> {
    return this.http.patch<OrganizationMemberDto>(
      `${this.apiUrl}/organizations/assigneUser/${userId}/role/MEMBER/toOrganization/${organizationId}`,
      {},
    );
  }

  removeUserFromOrganization(id: number, organizationId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/organizations/removeMember/${id}/fromOrganization/${organizationId}`,
      {},
    );
  }
  removeOwnerFromOrganization(userId: number, organizationId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/organizations/assigneUser/${userId}/role/MEMBER/toOrganization/${organizationId}`,
      {},
    );
  }

  addOwnerIntoOrganization(userId: number, organizationId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/organizations/addOwner/${userId}/toOrganization/${organizationId}`,
      {},
    );
  }

  addMemberIntoOrganization(id: number, organizationId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/organizations/addMember/${id}/toOrganization/${organizationId}`,
      {},
    );
  }

  removeOrg(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/organizations/decommission/${id}`);
  }

  markOrganizationsAsTrusted(organizationIds: number[]): Observable<Organization> {
    return this.http.patch<Organization>(`${this.apiUrl}/organizations/trustedStatus`, {
      organizationIds: organizationIds,
      trusted: true,
    });
  }

  markOrganizationsAsUntrusted(organizationIds: number[]): Observable<Organization> {
    return this.http.patch<Organization>(`${this.apiUrl}/organizations/trustedStatus`, {
      organizationIds: organizationIds,
      trusted: false,
    });
  }

  getAllUsers(page: number, size: number, sort: string) {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);

    return this.http.get<Page<User>>(`${this.apiUrl}/users/all`, { params });
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

  setPreferredLanguage(language: string) {
    return this.http.patch<User>(`${this.apiUrl}/users/preferredLanguage/${language}`, {});
  }

  isRoomRecordable(roomId: number, recordable: boolean) {
    return this.http.patch<Room>(`${this.apiUrl}/rooms/${roomId}/setRecordable/${recordable}`, {});
  }

  isReservationPaid(reservationId: Set<number>, paid: boolean) {
    const array = Array.from(reservationId);
    return this.http.patch<ReservationDto[]>(`${this.apiUrl}/reservations/paid/${paid}`, {
      reservationIds: array,
    });
  }

  getReservations(
    status: ReservationStatus | null,
    future: boolean,
    page: number,
    size: number,
    userId: number | null,
    organizationIds: Set<number> | null,
  ): Observable<Page<ReservationDto>> {
    let params = new HttpParams().set('page', page).set('size', size).set('future', future);

    if (status != null) {
      params = params.set('status', status);
    }

    if (userId != null) {
      params = params.set('userId', userId);
    }

    if (organizationIds != null && organizationIds.size > 0) {
      organizationIds.forEach((id) => {
        params = params.append('organizationsId', id);
      });
    }
    console.info('calling /reservations with params:', params.toString());
    return this.http.get<Page<ReservationDto>>(`${this.apiUrl}/reservations`, { params });
  }

  getOrganizations(
    page: number,
    size: number,
    withMembers: boolean,
    userId: number | null,
  ): Observable<Page<Organization>> {
    const params = new HttpParams()
      .set('userId', userId ?? '')
      .set('withMembers', withMembers)
      .set('page', page)
      .set('size', size);
    console.info('calling /organizations   with params:', params.toString());

    return this.http.get<Page<Organization>>(`${this.apiUrl}/organizations`, { params });
  }
}
