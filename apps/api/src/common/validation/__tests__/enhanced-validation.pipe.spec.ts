import { Test, TestingModule } from '@nestjs/testing';

describe('EnhancedValidationPipe', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<EnhancedValidationPipe>(/* EnhancedValidationPipe */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
