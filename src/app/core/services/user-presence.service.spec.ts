import { TestBed } from '@angular/core/testing';

import { UserPresenceService } from './user-presence.service';

describe('UserPresenceService', () => {
  let service: UserPresenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserPresenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
