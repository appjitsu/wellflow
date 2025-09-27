import { Test, TestingModule } from '@nestjs/testing';

describe('JoaRepository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<JoaRepository>(/* JoaRepository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
