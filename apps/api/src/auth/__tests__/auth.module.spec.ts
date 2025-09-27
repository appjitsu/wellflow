import { Test, TestingModule } from '@nestjs/testing';

describe('AuthModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<AuthModule>(/* AuthModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
