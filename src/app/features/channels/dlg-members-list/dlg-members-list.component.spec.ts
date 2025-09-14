import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlgMembersListComponent } from './dlg-members-list.component';

describe('DlgMembersListComponent', () => {
  let component: DlgMembersListComponent;
  let fixture: ComponentFixture<DlgMembersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DlgMembersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DlgMembersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
