import { Test, TestingModule } from '@nestjs/testing';

describe('domain-event', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<domain-event>(/* domain-event */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

