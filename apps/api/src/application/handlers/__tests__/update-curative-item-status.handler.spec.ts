import { Test, TestingModule } from '@nestjs/testing';

describe('UpdateCurativeItemStatusHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<UpdateCurativeItemStatusHandler>(/* UpdateCurativeItemStatusHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
