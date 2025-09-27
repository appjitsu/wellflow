import { Test, TestingModule } from '@nestjs/testing';

describe('maintenance-schedule.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<maintenance-schedule.repository.interface>(/* maintenance-schedule.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

