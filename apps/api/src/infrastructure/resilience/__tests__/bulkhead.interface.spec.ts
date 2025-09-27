import { Test, TestingModule } from '@nestjs/testing';

describe('bulkhead.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<bulkhead.interface>(/* bulkhead.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
