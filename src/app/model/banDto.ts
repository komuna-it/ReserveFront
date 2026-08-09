import { User } from './user';

export class BanDto {
  constructor(
    public id: number,
    public user: User,
    public bannedAt: Date,
    public banExpires: Date,
    public reason: string,
    public bannedBy: User,
  ) {}
}
