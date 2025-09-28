import { Test, TestingModule } from '@nestjs/testing';
import { PermitExpirationObserver } from '../regulatory-observers';

describe('PermitExpirationObserver', () => {
  let service: PermitExpirationObserver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermitExpirationObserver],
    }).compile();

    service = module.get<PermitExpirationObserver>(PermitExpirationObserver);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
