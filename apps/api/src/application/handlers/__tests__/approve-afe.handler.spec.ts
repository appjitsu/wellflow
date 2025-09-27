import { Test, TestingModule } from '@nestjs/testing';

describe('ApproveAfeHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<ApproveAfeHandler>(/* ApproveAfeHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
