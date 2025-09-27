import { Test, TestingModule } from '@nestjs/testing';

describe('WorkoverRepository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<WorkoverRepository>(/* WorkoverRepository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
