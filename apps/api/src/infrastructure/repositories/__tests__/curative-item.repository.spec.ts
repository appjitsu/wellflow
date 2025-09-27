import { Test, TestingModule } from '@nestjs/testing';

describe('CurativeItemRepositoryImpl', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<CurativeItemRepositoryImpl>(/* CurativeItemRepositoryImpl */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
