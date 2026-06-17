import { Organization } from './organization';
import { OrganizationFront } from './organizationFront';

export class Tab {
  constructor(
    public id: number,
    public name: string,
    public type: string,
    public org: Organization | undefined,
  ) {}
}
