export interface ReservationDto {
  id: number | null;
  reservedBy: number;
  behalfOf?: number | null;
  roomId: number;
  startAt: string;
  duration: string;
}
