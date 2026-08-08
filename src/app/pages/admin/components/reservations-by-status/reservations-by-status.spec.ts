import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationsByStatus } from './reservations-by-status';

describe('ReservationsByStatus', () => {
  let component: ReservationsByStatus;
  let fixture: ComponentFixture<ReservationsByStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationsByStatus],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationsByStatus);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
