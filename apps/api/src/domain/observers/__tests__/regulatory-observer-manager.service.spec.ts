import { Test, TestingModule } from '@nestjs/testing';

describe('RegulatoryObserverManagerService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RegulatoryObserverManagerService>(/* RegulatoryObserverManagerService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
