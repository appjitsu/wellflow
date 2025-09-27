import { Test, TestingModule } from '@nestjs/testing';

describe('GetDrillingProgramsByOrganizationHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDrillingProgramsByOrganizationHandler>(/* GetDrillingProgramsByOrganizationHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
