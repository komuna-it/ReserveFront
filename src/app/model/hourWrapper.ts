export class HourWrapper {
  constructor(
    public hour: number,
    public isReserved: boolean,
    public isReservedByMyOrganization: boolean,
  ) {}
}
