import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectedReservations } from './rejected-reservations';

describe('RejectedReservations', () => {
  let component: RejectedReservations;
  let fixture: ComponentFixture<RejectedReservations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RejectedReservations],
    }).compileComponents();

    fixture = TestBed.createComponent(RejectedReservations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
