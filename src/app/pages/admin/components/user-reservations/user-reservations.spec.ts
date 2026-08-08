import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserReservations } from './user-reservations';

describe('UserReservations', () => {
  let component: UserReservations;
  let fixture: ComponentFixture<UserReservations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserReservations],
    }).compileComponents();

    fixture = TestBed.createComponent(UserReservations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
