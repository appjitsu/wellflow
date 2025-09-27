import { Test, TestingModule } from '@nestjs/testing';

describe('GetWorkoversByOrganizationHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetWorkoversByOrganizationHandler>(/* GetWorkoversByOrganizationHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
