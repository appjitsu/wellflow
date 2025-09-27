import { Test, TestingModule } from '@nestjs/testing';

describe('WorkoverDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<WorkoverDto>(/* WorkoverDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
