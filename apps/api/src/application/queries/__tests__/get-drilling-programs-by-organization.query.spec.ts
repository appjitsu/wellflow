import { Test, TestingModule } from '@nestjs/testing';

describe('GetDrillingProgramsByOrganizationQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDrillingProgramsByOrganizationQuery>(/* GetDrillingProgramsByOrganizationQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
