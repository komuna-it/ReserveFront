// reservation.model.ts
export interface ReservationDto {
  id: number;
  reservedBy: number;
  behalfOf?: number | null;
  roomId: number;
  startAt: string; // ISO String: e.g., "2026-05-21T10:00:00"
  duration: string; // ISO-8601 Duration: e.g., "PT1H" (1 hour) or "PT2H"
}

export interface Room {
  id: number;
  name: string;
}
