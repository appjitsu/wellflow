import { Test, TestingModule } from '@nestjs/testing';

describe('GetDivisionOrdersByOrganizationQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDivisionOrdersByOrganizationQuery>(/* GetDivisionOrdersByOrganizationQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
