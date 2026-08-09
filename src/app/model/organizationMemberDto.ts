export class OrganizationMemberDto {
  constructor(
    public id: number,
    public organizationId: number,
    public userId: number,
    public role: string,
    public email: string,
    public nick: string,
  ) {}
}
