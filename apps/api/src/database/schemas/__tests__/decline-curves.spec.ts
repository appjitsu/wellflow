import { Test, TestingModule } from '@nestjs/testing';

describe('decline-curves', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<decline-curves>(/* decline-curves */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

