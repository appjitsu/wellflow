import { Test, TestingModule } from '@nestjs/testing';

describe('tenant-isolation-strategy.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<tenant-isolation-strategy.interface>(/* tenant-isolation-strategy.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

