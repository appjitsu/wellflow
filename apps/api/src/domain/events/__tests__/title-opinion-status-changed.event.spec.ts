import { Test, TestingModule } from '@nestjs/testing';

describe('TitleOpinionStatusChangedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<TitleOpinionStatusChangedEvent>(/* TitleOpinionStatusChangedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
