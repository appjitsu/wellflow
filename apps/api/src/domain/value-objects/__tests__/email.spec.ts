import { Test, TestingModule } from '@nestjs/testing';

describe('Email', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<Email>(/* Email */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
