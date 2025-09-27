import { Test, TestingModule } from '@nestjs/testing';

describe('OrganizationsRepositoryImpl', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<OrganizationsRepositoryImpl>(/* OrganizationsRepositoryImpl */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
