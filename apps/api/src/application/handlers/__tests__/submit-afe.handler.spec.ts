import { Test, TestingModule } from '@nestjs/testing';

describe('SubmitAfeHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<SubmitAfeHandler>(/* SubmitAfeHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
