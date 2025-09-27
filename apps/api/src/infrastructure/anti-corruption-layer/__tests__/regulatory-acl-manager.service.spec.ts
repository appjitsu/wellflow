import { Test, TestingModule } from '@nestjs/testing';

describe('RegulatoryACLManagerService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RegulatoryACLManagerService>(/* RegulatoryACLManagerService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
