import { TestBed } from '@angular/core/testing';

import { DirectMessagesFacadeService } from './direct-messages-facade.service';

describe('DirectMessagesFacadeService', () => {
  let service: DirectMessagesFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DirectMessagesFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
