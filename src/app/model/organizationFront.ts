import { User } from './user';

export class OrganizationFront {
  constructor(
    public id: number,
    public owner: User,
    public name: string,
    public users: User[],
  ) {}
}
