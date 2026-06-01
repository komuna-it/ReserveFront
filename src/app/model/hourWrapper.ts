export class HourWrapper {
  constructor(
    public hour: number,
    public isReserved: boolean,
    public isFirstHourOfReservation: boolean | undefined,
    public isLastHourOfReservation: boolean | undefined,
    public isReservedByMyOrganization: boolean,
  ) {}
}
