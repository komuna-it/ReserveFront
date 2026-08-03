import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestCancellationReservationsComponent } from './request-cancellation-reservations-component';

describe('RequestCancellationReservationsComponent', () => {
  let component: RequestCancellationReservationsComponent;
  let fixture: ComponentFixture<RequestCancellationReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestCancellationReservationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestCancellationReservationsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
