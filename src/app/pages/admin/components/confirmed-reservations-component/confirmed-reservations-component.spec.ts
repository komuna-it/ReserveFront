import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmedReservationsComponent } from './confirmed-reservations-component';

describe('ConfirmedReservationsComponent', () => {
  let component: ConfirmedReservationsComponent;
  let fixture: ComponentFixture<ConfirmedReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmedReservationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmedReservationsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
