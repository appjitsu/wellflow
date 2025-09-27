import { Test, TestingModule } from '@nestjs/testing';

describe('CurativeActivityRepositoryImpl', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<CurativeActivityRepositoryImpl>(/* CurativeActivityRepositoryImpl */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
