import { Test, TestingModule } from '@nestjs/testing';

describe('jib-statement.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<jib-statement.repository.interface>(/* jib-statement.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

