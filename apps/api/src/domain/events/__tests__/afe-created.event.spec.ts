import { Test, TestingModule } from '@nestjs/testing';

describe('AfeCreatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<AfeCreatedEvent>(/* AfeCreatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
