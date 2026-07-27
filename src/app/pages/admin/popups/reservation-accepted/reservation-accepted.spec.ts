import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationAccepted } from './reservation-accepted';

describe('ReservationAccepted', () => {
  let component: ReservationAccepted;
  let fixture: ComponentFixture<ReservationAccepted>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationAccepted],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationAccepted);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
