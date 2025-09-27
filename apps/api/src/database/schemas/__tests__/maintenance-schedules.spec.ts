import { Test, TestingModule } from '@nestjs/testing';

describe('maintenance-schedules', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<maintenance-schedules>(/* maintenance-schedules */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

