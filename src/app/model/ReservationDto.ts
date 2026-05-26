export interface ReservationReq {
  reservedBy: number;
  behalfOf?: number | null;
  roomId: number;
  startAt: string;
  duration: string;
}

export interface ReservationResp extends ReservationReq {
  id: number;
}
