import { Test, TestingModule } from '@nestjs/testing';

describe('lease-partners', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<lease-partners>(/* lease-partners */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

