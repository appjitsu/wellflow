import { Test, TestingModule } from '@nestjs/testing';

describe('AdapterRegistryService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<AdapterRegistryService>(/* AdapterRegistryService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
