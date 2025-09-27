import { Test, TestingModule } from '@nestjs/testing';

describe('AfeStatusChangedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<AfeStatusChangedEvent>(/* AfeStatusChangedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
