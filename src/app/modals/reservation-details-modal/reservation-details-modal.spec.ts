import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationDetailsModal } from './reservation-details-modal';

describe('ReservationDetailsModal', () => {
  let component: ReservationDetailsModal;
  let fixture: ComponentFixture<ReservationDetailsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDetailsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationDetailsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
