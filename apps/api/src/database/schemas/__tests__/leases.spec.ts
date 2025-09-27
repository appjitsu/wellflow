import { Test, TestingModule } from '@nestjs/testing';

describe('leases', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<leases>(/* leases */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
