import { Test, TestingModule } from '@nestjs/testing';

describe('PermitRenewalApprovedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<PermitRenewalApprovedEvent>(/* PermitRenewalApprovedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
