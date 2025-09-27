import { Test, TestingModule } from '@nestjs/testing';

describe('LeaseOperatingStatementsModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<LeaseOperatingStatementsModule>(/* LeaseOperatingStatementsModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
