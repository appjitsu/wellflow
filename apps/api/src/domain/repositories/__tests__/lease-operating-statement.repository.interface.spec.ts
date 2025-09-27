import { Test, TestingModule } from '@nestjs/testing';

describe('lease-operating-statement.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<lease-operating-statement.repository.interface>(/* lease-operating-statement.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

