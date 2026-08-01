export class OrganizationMemberDto {
  constructor(
    public id: number,
    public role: string,
    public email: string,
    public nick: string,
    public trusted: boolean,
  ) {}
}
