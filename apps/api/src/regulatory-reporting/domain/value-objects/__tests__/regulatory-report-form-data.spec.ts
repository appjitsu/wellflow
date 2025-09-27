import { Test, TestingModule } from '@nestjs/testing';

describe('regulatory-report-form-data', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<regulatory-report-form-data>(/* regulatory-report-form-data */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

