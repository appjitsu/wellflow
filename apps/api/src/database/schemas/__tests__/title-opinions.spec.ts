import { Test, TestingModule } from '@nestjs/testing';

describe('title-opinions', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<title-opinions>(/* title-opinions */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

