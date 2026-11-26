import { ReservationType } from './reservationType';

export interface CreateReservationRequest {
  roomId: number;
  startAt: string;
  duration: string;
  type: ReservationType;
  organizationId?: number | null;
  userId?: number | null;
  actorUserId?: number;
}
