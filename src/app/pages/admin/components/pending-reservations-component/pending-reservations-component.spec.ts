import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingReservationsComponent } from './pending-reservations-component';

describe('PendingReservationsComponent', () => {
  let component: PendingReservationsComponent;
  let fixture: ComponentFixture<PendingReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingReservationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PendingReservationsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
