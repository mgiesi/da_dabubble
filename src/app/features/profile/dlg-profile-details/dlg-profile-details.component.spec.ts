import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlgProfileDetailsComponent } from './dlg-profile-details.component';

describe('DlgProfileDetailsComponent', () => {
  let component: DlgProfileDetailsComponent;
  let fixture: ComponentFixture<DlgProfileDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DlgProfileDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DlgProfileDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
