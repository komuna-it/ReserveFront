import { User } from './User';

export class Organization {
  constructor(
    public id: number,
    public name: string,
    public users: User[],
  ) {}
}
