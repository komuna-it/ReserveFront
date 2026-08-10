import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarRoom } from './calendar-room';

describe('CalendarRoom', () => {
  let component: CalendarRoom;
  let fixture: ComponentFixture<CalendarRoom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarRoom],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarRoom);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
