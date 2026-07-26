import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelledReservationsComponent } from './cancelled-reservations-component';

describe('CancelledReservationsComponent', () => {
  let component: CancelledReservationsComponent;
  let fixture: ComponentFixture<CancelledReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CancelledReservationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CancelledReservationsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
