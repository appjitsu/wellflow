import { Test, TestingModule } from '@nestjs/testing';

describe('users', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<users>(/* users */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
