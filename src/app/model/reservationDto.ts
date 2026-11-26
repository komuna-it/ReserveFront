import { ReservationStatus } from './reservationStatus';
import { ReservationType } from './reservationType';

export interface ReservationDto {
  id: number;
  type: ReservationType;
  organizationId: number;
  userId: number;
  roomId: number;
  startAt: string;
  endAt: string;
  duration: string;
  status: ReservationStatus;
  price: number;
  paid: boolean;
  actorUserId: number;
}
