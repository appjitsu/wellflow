import { Test, TestingModule } from '@nestjs/testing';

describe('users.repository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<users.repository>(/* users.repository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
