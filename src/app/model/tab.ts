export class Tab {
  constructor(
    public id: number,
    public name: string,
    public type: string,
    public organizationName: string | undefined,
    public organizationId: number | undefined,
  ) {}
}
