import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableReservationsAdmin } from './table-reservations-admin';

describe('TableReservationsUser', () => {
  let component: TableReservationsAdmin;
  let fixture: ComponentFixture<TableReservationsAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableReservationsAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(TableReservationsAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
