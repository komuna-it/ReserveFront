import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarHour } from './calendar-hour';

describe('CalendarHour', () => {
  let component: CalendarHour;
  let fixture: ComponentFixture<CalendarHour>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarHour],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarHour);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
