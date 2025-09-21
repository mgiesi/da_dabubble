import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlgAssignMembersComponent } from './dlg-assign-members.component';

describe('DlgAssignMembersComponent', () => {
  let component: DlgAssignMembersComponent;
  let fixture: ComponentFixture<DlgAssignMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DlgAssignMembersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DlgAssignMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
