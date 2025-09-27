import { Test, TestingModule } from '@nestjs/testing';

describe('ExpiringPermitSpecification', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<ExpiringPermitSpecification>(/* ExpiringPermitSpecification */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
