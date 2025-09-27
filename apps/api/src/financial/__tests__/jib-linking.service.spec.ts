import { Test, TestingModule } from '@nestjs/testing';

describe('JibLinkingService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<JibLinkingService>(/* JibLinkingService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
