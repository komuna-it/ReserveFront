import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorPopup } from './error-popup';

describe('ErrorPopup', () => {
  let component: ErrorPopup;
  let fixture: ComponentFixture<ErrorPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorPopup],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorPopup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
