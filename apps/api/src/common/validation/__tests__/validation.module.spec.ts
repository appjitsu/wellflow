import { Test, TestingModule } from '@nestjs/testing';

describe('ValidationModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<ValidationModule>(/* ValidationModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
