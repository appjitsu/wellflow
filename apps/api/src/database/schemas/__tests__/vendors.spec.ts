import { Test, TestingModule } from '@nestjs/testing';

describe('vendors', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<vendors>(/* vendors */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
