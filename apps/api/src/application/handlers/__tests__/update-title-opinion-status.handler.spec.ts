import { Test, TestingModule } from '@nestjs/testing';

describe('UpdateTitleOpinionStatusHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<UpdateTitleOpinionStatusHandler>(/* UpdateTitleOpinionStatusHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
