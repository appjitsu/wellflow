import { Test, TestingModule } from '@nestjs/testing';

describe('DatabaseConfigModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<DatabaseConfigModule>(/* DatabaseConfigModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
