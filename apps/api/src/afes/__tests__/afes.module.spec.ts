import { Test, TestingModule } from '@nestjs/testing';

describe('AfesModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<AfesModule>(/* AfesModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
