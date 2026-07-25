import { User } from './user';

export class Organization {
  constructor(
    public id: number,
    public name: string,
    public owners: User[],
    public created: Date,
    public members?: User[],
  ) {}
}
