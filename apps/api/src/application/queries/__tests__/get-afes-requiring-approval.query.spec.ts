import { Test, TestingModule } from '@nestjs/testing';

describe('GetAfesRequiringApprovalQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetAfesRequiringApprovalQuery>(/* GetAfesRequiringApprovalQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
