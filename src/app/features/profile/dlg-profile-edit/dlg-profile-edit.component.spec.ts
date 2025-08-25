import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlgProfileEditComponent } from './dlg-profile-edit.component';

describe('DlgProfileEditComponent', () => {
  let component: DlgProfileEditComponent;
  let fixture: ComponentFixture<DlgProfileEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DlgProfileEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DlgProfileEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
