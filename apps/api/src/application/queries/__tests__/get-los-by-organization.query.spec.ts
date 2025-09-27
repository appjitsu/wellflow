import { Test, TestingModule } from '@nestjs/testing';

describe('GetLosByOrganizationQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetLosByOrganizationQuery>(/* GetLosByOrganizationQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
