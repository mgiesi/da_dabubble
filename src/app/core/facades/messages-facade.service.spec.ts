import { TestBed } from '@angular/core/testing';

import { MessagesFacadeService } from './messages-facade.service';

describe('MessagesFacadeService', () => {
  let service: MessagesFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessagesFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
