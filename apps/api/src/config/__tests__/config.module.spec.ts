import { Test, TestingModule } from '@nestjs/testing';

describe('ConfigModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<ConfigModule>(/* ConfigModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
