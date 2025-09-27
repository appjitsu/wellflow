import { Test, TestingModule } from '@nestjs/testing';

describe('UserRegisteredEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<UserRegisteredEvent>(/* UserRegisteredEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
