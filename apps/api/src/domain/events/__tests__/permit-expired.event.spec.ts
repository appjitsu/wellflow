import { Test, TestingModule } from '@nestjs/testing';

describe('PermitExpiredEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<PermitExpiredEvent>(/* PermitExpiredEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
