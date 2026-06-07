export class HourWrapper {
  constructor(
    public hour: number,
    public isReserved: boolean,
    public isFirstHourOfReservation: boolean,
    public isLastHourOfReservation: boolean,
    public isReservedByMyOrganization: boolean,
    public isDisabled: boolean,
    public bandName: string,
  ) {}
}
