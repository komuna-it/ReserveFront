import { ReservationType } from './reservationType';

export interface CreateReservationRequest {
  roomId: number;
  startAt: string;
  duration: string;
  type: ReservationType;
  organizationId?: number | null;
  reservedByUserId?: number | null;
}
