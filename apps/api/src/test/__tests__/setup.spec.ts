import { Test, TestingModule } from '@nestjs/testing';

describe('setup', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<setup>(/* setup */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
