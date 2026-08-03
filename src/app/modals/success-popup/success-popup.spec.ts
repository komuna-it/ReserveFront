import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuccessPopup } from './success-popup';

describe('SuccessPopup', () => {
  let component: SuccessPopup;
  let fixture: ComponentFixture<SuccessPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuccessPopup],
    }).compileComponents();

    fixture = TestBed.createComponent(SuccessPopup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
