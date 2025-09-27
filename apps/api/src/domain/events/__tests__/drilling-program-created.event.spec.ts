import { Test, TestingModule } from '@nestjs/testing';

describe('DrillingProgramCreatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<DrillingProgramCreatedEvent>(/* DrillingProgramCreatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
