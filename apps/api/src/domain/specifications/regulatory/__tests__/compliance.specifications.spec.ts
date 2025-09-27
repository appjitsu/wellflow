import { Test, TestingModule } from '@nestjs/testing';

describe('PermitExpiringSoonSpecification', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<PermitExpiringSoonSpecification>(/* PermitExpiringSoonSpecification */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
