import { Test, TestingModule } from '@nestjs/testing';

describe('PermitRenewalRequestedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<PermitRenewalRequestedEvent>(/* PermitRenewalRequestedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
