import { Test, TestingModule } from '@nestjs/testing';

describe('curative-item.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<curative-item.repository.interface>(/* curative-item.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

