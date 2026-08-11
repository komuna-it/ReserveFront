import { PriceByReservationType } from './priceByReservationType';

export interface Room {
  id: number;
  name: string;
  isRecordable: boolean;
  pricing: PriceByReservationType[];
}
