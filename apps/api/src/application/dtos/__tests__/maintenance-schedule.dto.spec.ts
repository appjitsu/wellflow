import { Test, TestingModule } from '@nestjs/testing';

describe('maintenance-schedule.dto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<maintenance-schedule.dto>(/* maintenance-schedule.dto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

