import { Test, TestingModule } from '@nestjs/testing';

describe('curative-item-document.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<curative-item-document.repository.interface>(/* curative-item-document.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

