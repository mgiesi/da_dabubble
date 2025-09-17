import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlgEditMembersComponent } from './dlg-edit-members.component';

describe('DlgAddMembersComponent', () => {
  let component: DlgEditMembersComponent;
  let fixture: ComponentFixture<DlgEditMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DlgEditMembersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DlgEditMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
