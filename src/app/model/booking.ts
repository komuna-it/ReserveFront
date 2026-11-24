import { ReservationType } from './reservationType';

export interface Booking {
  date: Date;
  hour: number;
  roomId: number;
  price?: number;
  duration?: number;
  roomName: string | undefined;
  organizationId?: number | null;
  reservedByUserId?: number;
  reservationType?: ReservationType;
}
