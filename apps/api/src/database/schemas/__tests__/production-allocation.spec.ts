import { Test, TestingModule } from '@nestjs/testing';

describe('production-allocation', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<production-allocation>(/* production-allocation */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

