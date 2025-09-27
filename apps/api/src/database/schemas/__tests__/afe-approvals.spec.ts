import { Test, TestingModule } from '@nestjs/testing';

describe('afe-approvals', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<afe-approvals>(/* afe-approvals */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

