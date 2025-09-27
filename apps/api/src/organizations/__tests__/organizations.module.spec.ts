import { Test, TestingModule } from '@nestjs/testing';

describe('OrganizationsModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<OrganizationsModule>(/* OrganizationsModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
