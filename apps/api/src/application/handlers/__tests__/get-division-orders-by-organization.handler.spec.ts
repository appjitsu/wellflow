import { Test, TestingModule } from '@nestjs/testing';

describe('GetDivisionOrdersByOrganizationHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDivisionOrdersByOrganizationHandler>(/* GetDivisionOrdersByOrganizationHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
