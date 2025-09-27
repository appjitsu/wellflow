import { Test, TestingModule } from '@nestjs/testing';

describe('UserAccountLockedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<UserAccountLockedEvent>(/* UserAccountLockedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
