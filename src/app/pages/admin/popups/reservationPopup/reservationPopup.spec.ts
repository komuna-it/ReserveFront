import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationPopup } from './reservationPopup';

describe('Reservation', () => {
  let component: ReservationPopup;
  let fixture: ComponentFixture<ReservationPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationPopup],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationPopup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
