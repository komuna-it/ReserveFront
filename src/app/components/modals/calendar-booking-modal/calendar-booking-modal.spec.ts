import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarBookingModal } from './calendar-booking-modal';

describe('CalendarBookingModal', () => {
  let component: CalendarBookingModal;
  let fixture: ComponentFixture<CalendarBookingModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarBookingModal],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarBookingModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
