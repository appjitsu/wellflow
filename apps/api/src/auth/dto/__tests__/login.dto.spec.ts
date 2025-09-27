import { Test, TestingModule } from '@nestjs/testing';

describe('LoginDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<LoginDto>(/* LoginDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
