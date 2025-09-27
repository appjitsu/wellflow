import { Test, TestingModule } from '@nestjs/testing';

describe('AfeSubmittedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<AfeSubmittedEvent>(/* AfeSubmittedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
