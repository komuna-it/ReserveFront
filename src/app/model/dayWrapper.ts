import { HourWrapper } from './hourWrapper';

export class DayWrapper {
  constructor(
    public date: Date,
    public hours: HourWrapper[],
    public roomName: string,
  ) {}
  constuctor() {}
}
