import { Test, TestingModule } from '@nestjs/testing';

describe('CoCogccForm7Adapter', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<CoCogccForm7Adapter>(/* CoCogccForm7Adapter */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
