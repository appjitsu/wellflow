import { Test, TestingModule } from '@nestjs/testing';

describe('audit-log.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<audit-log.repository.interface>(/* audit-log.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

