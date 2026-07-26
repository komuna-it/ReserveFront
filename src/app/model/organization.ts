import { User } from './user';

export class Organization {
  constructor(
    public id: number,
    public name: string,
    public created: Date,
    public trusted: boolean,
    public owners?: User[],
    public members?: User[],
  ) {}
}
