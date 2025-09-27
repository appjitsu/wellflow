import { Test, TestingModule } from '@nestjs/testing';

describe('jib-statements', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<jib-statements>(/* jib-statements */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

