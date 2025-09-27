import { Test, TestingModule } from '@nestjs/testing';

describe('current-user.decorator', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<current-user.decorator>(/* current-user.decorator */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

