import { inject, Injectable, isDevMode } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Room } from '../../model/room';
import { ReservationDto } from '../../model/reservationDto';
import { Observable, throwError } from 'rxjs';
import { Page } from '../../model/page';
import { ReservationStatus } from '../../model/reservationStatus';
import { ReservationType } from '../../model/reservationType';
import { environment } from '../../../environments/environment';
import { ReservationQueryParams } from '../../model/reservationQueryParams';

@Injectable({ providedIn: 'root' })
export class ReservationApi {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

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

  isRoomRecordable(roomId: number, recordable: boolean) {
    return this.http.patch<Room>(`${this.apiUrl}/rooms/${roomId}/setRecordable/${recordable}`, {});
  }

  isReservationPaid(reservationId: Set<number>, paid: boolean) {
    const array = Array.from(reservationId);
    return this.http.patch<ReservationDto[]>(`${this.apiUrl}/reservations/paid/${paid}`, {
      reservationIds: array,
    });
  }

  getReservationsCountByStatus() {
    return this.http.get<Map<ReservationStatus, number> | null>(
      `${this.apiUrl}/reservations/summary`,
      {},
    );
  }

  getReservations(paramsObj: ReservationQueryParams): Observable<Page<ReservationDto>> {
    let params = new HttpParams()
      .set('page', paramsObj.page ?? 0)
      .set('size', paramsObj.size ?? 10)
      .set('future', paramsObj.future ?? false);

    let sortBy = paramsObj.sortBy;
    const sortDir = paramsObj.sortDir ?? 'desc';
    if (sortBy) {
      params = params.set('sort', `${sortBy},${sortDir}`);
    }
    if (
      ['reservedBy', 'reservedBy.nick', 'nick', 'email', 'trusted'].includes(paramsObj.sortBy ?? '')
    ) {
      paramsObj.sortBy = 'id';
    }
    if (paramsObj.startAtAfter) params = params.set('startAtAfter', paramsObj.startAtAfter);
    if (paramsObj.startAtBefore) params = params.set('startAtBefore', paramsObj.startAtBefore);

    if (paramsObj.statuses && paramsObj.statuses.size > 0) {
      paramsObj.statuses.forEach((status) => {
        params = params.append('status', status);
      });
    }

    if (paramsObj.userId != null) params = params.set('userId', paramsObj.userId);

    if (paramsObj.organizationIds && paramsObj.organizationIds.size > 0) {
      paramsObj.organizationIds.forEach((id) => {
        params = params.append('organizationsId', id);
      });
    }

    if (isDevMode()) console.info('calling /reservations with params:', params.toString());

    return this.http.get<Page<ReservationDto>>(`${this.apiUrl}/reservations`, { params });
  }

  updateReservationsStatus(
    resIds: Set<number>,
    status: ReservationStatus,
  ): Observable<Page<ReservationDto>> {
    const reservationIds = Array.from(resIds);

    switch (status) {
      case ReservationStatus.CONFIRMED:
        return this.http.post<Page<ReservationDto>>(`${this.apiUrl}/reservations/confirm`, {
          reservationIds,
        });
      case ReservationStatus.REQUESTED_CANCELLATION:
        return this.http.post<Page<ReservationDto>>(`${this.apiUrl}/reservations/requestCancel`, {
          reservationIds,
        });
      case ReservationStatus.CANCELLED:
        return this.http.post<Page<ReservationDto>>(`${this.apiUrl}/reservations/confirmCancel`, {
          reservationIds,
        });
      case ReservationStatus.REJECTED:
        return this.http.post<Page<ReservationDto>>(`${this.apiUrl}/reservations/reject`, {
          reservationIds,
        });
      case ReservationStatus.REJECTED_CANCELLATION:
        return this.http.post<Page<ReservationDto>>(`${this.apiUrl}/reservations/rejectCancel`, {
          reservationIds,
        });
      default:
        console.error('Unsupported status:', status);
        return throwError(() => new Error(`Unsupported reservation status: ${status}`));
    }
  }
}
