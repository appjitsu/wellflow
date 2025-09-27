import { Test, TestingModule } from '@nestjs/testing';

describe('AuthController', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<AuthController>(/* AuthController */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
