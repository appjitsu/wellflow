import { Test, TestingModule } from '@nestjs/testing';

describe('AuthToken', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<AuthToken>(/* AuthToken */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
