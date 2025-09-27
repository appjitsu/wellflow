import { Test, TestingModule } from '@nestjs/testing';

describe('DivisionOrderDeactivatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<DivisionOrderDeactivatedEvent>(/* DivisionOrderDeactivatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
