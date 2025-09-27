import { Test, TestingModule } from '@nestjs/testing';

describe('wells', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<wells>(/* wells */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
