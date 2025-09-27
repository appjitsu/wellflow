import { Test, TestingModule } from '@nestjs/testing';

describe('JibStatementRepository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<JibStatementRepository>(/* JibStatementRepository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
