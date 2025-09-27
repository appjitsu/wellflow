import { Test, TestingModule } from '@nestjs/testing';

describe('RecordCashCallConsentDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RecordCashCallConsentDto>(/* RecordCashCallConsentDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
