import { Test, TestingModule } from '@nestjs/testing';

describe('permit.repository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<permit.repository>(/* permit.repository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
