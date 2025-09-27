import { Test, TestingModule } from '@nestjs/testing';

describe('Password', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<Password>(/* Password */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
