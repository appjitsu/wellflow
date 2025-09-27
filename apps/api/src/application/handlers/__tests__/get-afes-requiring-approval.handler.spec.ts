import { Test, TestingModule } from '@nestjs/testing';

describe('GetAfesRequiringApprovalHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetAfesRequiringApprovalHandler>(/* GetAfesRequiringApprovalHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
