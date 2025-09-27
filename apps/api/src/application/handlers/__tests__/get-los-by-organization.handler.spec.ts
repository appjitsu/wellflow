import { Test, TestingModule } from '@nestjs/testing';

describe('GetLosByOrganizationHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetLosByOrganizationHandler>(/* GetLosByOrganizationHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
