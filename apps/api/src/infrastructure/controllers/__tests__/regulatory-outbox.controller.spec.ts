import { Test, TestingModule } from '@nestjs/testing';

describe('RegulatoryOutboxController', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RegulatoryOutboxController>(/* RegulatoryOutboxController */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
