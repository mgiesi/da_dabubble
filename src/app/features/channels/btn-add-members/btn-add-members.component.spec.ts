import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BtnAddMembersComponent } from './btn-add-members.component';

describe('BtnAddMembersComponent', () => {
  let component: BtnAddMembersComponent;
  let fixture: ComponentFixture<BtnAddMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BtnAddMembersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BtnAddMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
