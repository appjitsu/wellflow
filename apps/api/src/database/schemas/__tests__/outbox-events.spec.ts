import { Test, TestingModule } from '@nestjs/testing';

describe('outbox-events', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<outbox-events>(/* outbox-events */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

