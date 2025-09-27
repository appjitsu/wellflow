import { Test, TestingModule } from '@nestjs/testing';

describe('regulatory-acls', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<regulatory-acls>(/* regulatory-acls */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

