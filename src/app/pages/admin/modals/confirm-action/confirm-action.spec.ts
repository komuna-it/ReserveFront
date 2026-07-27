import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmAction } from './confirm-action';

describe('ConfirmAction', () => {
  let component: ConfirmAction;
  let fixture: ComponentFixture<ConfirmAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmAction],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmAction);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
