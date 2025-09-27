import { Test, TestingModule } from '@nestjs/testing';

describe('WellStatusChangedHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<WellStatusChangedHandler>(/* WellStatusChangedHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
