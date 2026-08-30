import { ReservationStatus } from './reservationStatus';

export interface ReservationQueryParams {
  statuses?: Set<ReservationStatus> | null;
  future?: boolean;
  userId?: number | null;
  organizationIds?: Set<number> | null;
  startAtAfter?: string | null;
  startAtBefore?: string | null;
  page?: number;
  size?: number;
}
