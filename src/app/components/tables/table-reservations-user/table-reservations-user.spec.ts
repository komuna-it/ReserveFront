import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableReservationsUser } from './table-reservations-user';

describe('TableReservationsUser', () => {
  let component: TableReservationsUser;
  let fixture: ComponentFixture<TableReservationsUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableReservationsUser],
    }).compileComponents();

    fixture = TestBed.createComponent(TableReservationsUser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
