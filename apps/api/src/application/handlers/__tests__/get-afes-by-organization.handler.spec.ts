import { Test, TestingModule } from '@nestjs/testing';

describe('GetAfesByOrganizationHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetAfesByOrganizationHandler>(/* GetAfesByOrganizationHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
