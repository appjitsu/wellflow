import { Test, TestingModule } from '@nestjs/testing';

describe('UserLoggedInEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<UserLoggedInEvent>(/* UserLoggedInEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
