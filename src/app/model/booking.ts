import { ReservationType } from './reservationType';

export interface Booking {
  date: string;
  hour: number;
  roomId: number;
  duration: number;
  roomName: string | undefined;
  organizationId: number;
  reservedByUserId: number;
  reservationType: ReservationType;
}
