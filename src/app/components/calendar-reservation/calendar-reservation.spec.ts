import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarReservation } from './calendar-reservation';

describe('CalendarReservation', () => {
  let component: CalendarReservation;
  let fixture: ComponentFixture<CalendarReservation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarReservation],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarReservation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
