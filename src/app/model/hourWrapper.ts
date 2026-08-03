export class HourWrapper {
  constructor(
    public hour: number,
    public isReserved: boolean,
    public isFirstHourOfReservation: boolean,
    public isLastHourOfReservation: boolean,
    public isReservedByMyOrganization: boolean,
    public isDisabled: boolean,
    public bandName: string,
    public isPrivateReservation: boolean = false,
    public privateReservationText: string = '',
    public reservedByUserId: number | null = null,
    public reservationText: string = '',
    public isMyPrivateReservation: boolean = false,
  ) {}
}
