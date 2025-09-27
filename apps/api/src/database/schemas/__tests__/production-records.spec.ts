import { Test, TestingModule } from '@nestjs/testing';

describe('production-records', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<production-records>(/* production-records */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

