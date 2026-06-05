export class ReservationWrapper {
  public durationLabel: string = '';
  constructor(
    public reservedByUserId: number,
    public reservedByUserName: string,
    public roomId: number,
    public roomName: string,
    public startAt: string,
    public duration: string,
    public id: number | null,
    public behalfOfId?: number | null,
    public behalfOfName?: string | null,
  ) {}
}
