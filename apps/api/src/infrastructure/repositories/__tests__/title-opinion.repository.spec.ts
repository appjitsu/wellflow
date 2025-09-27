import { Test, TestingModule } from '@nestjs/testing';

describe('TitleOpinionRepositoryImpl', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<TitleOpinionRepositoryImpl>(/* TitleOpinionRepositoryImpl */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
