import { Test, TestingModule } from '@nestjs/testing';

describe('DailyDrillingReportsController', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<DailyDrillingReportsController>(/* DailyDrillingReportsController */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
