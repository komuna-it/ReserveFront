import { PriceByReservationType } from './priceByReservationType';
import { ReservationType } from './reservationType';

export interface Room {
  id: number;
  name: string;
  isRecordable: boolean;
  pricing: Record<ReservationType, number>;
}
