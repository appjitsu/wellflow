import { Test, TestingModule } from '@nestjs/testing';

describe('abilities.decorator', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<abilities.decorator>(/* abilities.decorator */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
