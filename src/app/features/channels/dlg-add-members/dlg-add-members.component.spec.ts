import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlgAddMembersComponent } from './dlg-add-members.component';

describe('DlgAddMembersComponent', () => {
  let component: DlgAddMembersComponent;
  let fixture: ComponentFixture<DlgAddMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DlgAddMembersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DlgAddMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
