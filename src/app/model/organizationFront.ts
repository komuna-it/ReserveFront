import { User } from './user';

export class OrganizationFront {
  constructor(
    public id: number,
    public ownerId: number,
    public name: string,
    public users: User[],
  ) {}
}
