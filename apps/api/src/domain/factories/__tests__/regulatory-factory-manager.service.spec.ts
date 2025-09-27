import { Test, TestingModule } from '@nestjs/testing';

describe('RegulatoryFactoryManagerService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RegulatoryFactoryManagerService>(/* RegulatoryFactoryManagerService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
