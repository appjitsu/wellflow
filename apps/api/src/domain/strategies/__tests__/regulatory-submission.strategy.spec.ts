import { Test, TestingModule } from '@nestjs/testing';

describe('EPARegulatorySubmissionStrategy', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<EPARegulatorySubmissionStrategy>(/* EPARegulatorySubmissionStrategy */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
