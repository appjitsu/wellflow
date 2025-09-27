import { Test, TestingModule } from '@nestjs/testing';

describe('curative-item-documents', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<curative-item-documents>(/* curative-item-documents */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

