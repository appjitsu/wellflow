import { Test, TestingModule } from '@nestjs/testing';

describe('well-mock.helper', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<well-mock.helper>(/* well-mock.helper */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

