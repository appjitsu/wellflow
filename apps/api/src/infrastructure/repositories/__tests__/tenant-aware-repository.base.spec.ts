import { Test, TestingModule } from '@nestjs/testing';

describe('tenant-aware-repository.base', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<tenant-aware-repository.base>(/* tenant-aware-repository.base */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

