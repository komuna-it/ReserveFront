import { DayWrapper } from './dayWrapper';

export class WeekWrapper {
  constructor(
    public weekStartDate: Date | null,
    public days: DayWrapper[],
  ) {}
}
