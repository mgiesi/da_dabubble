import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembersMiniaturInfoComponent } from './members-miniatur-info.component';

describe('MembersMiniaturInfoComponent', () => {
  let component: MembersMiniaturInfoComponent;
  let fixture: ComponentFixture<MembersMiniaturInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembersMiniaturInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembersMiniaturInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
