import { Test, TestingModule } from '@nestjs/testing';

describe('GetWorkoversByOrganizationQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetWorkoversByOrganizationQuery>(/* GetWorkoversByOrganizationQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
