import { Test, TestingModule } from '@nestjs/testing';

describe('RepositoryModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<RepositoryModule>(/* RepositoryModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
