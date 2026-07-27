import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationCanceled } from './reservation-canceled';

describe('ReservationCanceled', () => {
  let component: ReservationCanceled;
  let fixture: ComponentFixture<ReservationCanceled>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationCanceled],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationCanceled);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
