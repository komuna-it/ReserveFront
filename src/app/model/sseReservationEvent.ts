import { ReservationDto } from './reservationDto';

export class SseReservationEvent {
  constructor(
    public id: number,
    public reservationDtO: ReservationDto,
    public type: string,
  ) {}
}
