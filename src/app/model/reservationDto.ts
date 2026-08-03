import { ReservationStatus } from './reservationStatus';
import { ReservationType } from './reservationType';

export interface ReservationDto {
  id: number;
  type: ReservationType;
  organization: number;
  reservedBy: number;
  room: number;
  startAt: string;
  endAt: string;
  duration: string;
  status: ReservationStatus;
}
