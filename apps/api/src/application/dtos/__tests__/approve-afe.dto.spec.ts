import { Test, TestingModule } from '@nestjs/testing';

describe('ApproveAfeDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<ApproveAfeDto>(/* ApproveAfeDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
