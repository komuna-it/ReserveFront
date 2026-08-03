import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableByStatus } from './table-by-status';

describe('TableByStatus', () => {
  let component: TableByStatus;
  let fixture: ComponentFixture<TableByStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableByStatus],
    }).compileComponents();

    fixture = TestBed.createComponent(TableByStatus);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
