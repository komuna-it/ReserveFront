import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableToolbar } from './table-toolbar';

describe('TableToolbar', () => {
  let component: TableToolbar;
  let fixture: ComponentFixture<TableToolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableToolbar],
    }).compileComponents();

    fixture = TestBed.createComponent(TableToolbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
