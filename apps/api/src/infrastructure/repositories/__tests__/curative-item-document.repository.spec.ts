import { Test, TestingModule } from '@nestjs/testing';

describe('CurativeItemDocumentRepositoryImpl', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<CurativeItemDocumentRepositoryImpl>(/* CurativeItemDocumentRepositoryImpl */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
