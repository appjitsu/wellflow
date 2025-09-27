import { Test, TestingModule } from '@nestjs/testing';

describe('NmOcdC115Adapter', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<NmOcdC115Adapter>(/* NmOcdC115Adapter */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
