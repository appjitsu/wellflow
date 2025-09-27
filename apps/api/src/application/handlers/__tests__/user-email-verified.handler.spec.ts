import { Test, TestingModule } from '@nestjs/testing';

describe('UserEmailVerifiedHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<UserEmailVerifiedHandler>(/* UserEmailVerifiedHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
