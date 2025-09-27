import { Test, TestingModule } from '@nestjs/testing';

describe('RegulatoryOutboxService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RegulatoryOutboxService>(/* RegulatoryOutboxService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
