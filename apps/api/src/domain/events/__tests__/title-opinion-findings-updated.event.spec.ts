import { Test, TestingModule } from '@nestjs/testing';

describe('TitleOpinionFindingsUpdatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<TitleOpinionFindingsUpdatedEvent>(/* TitleOpinionFindingsUpdatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
