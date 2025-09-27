import { Test, TestingModule } from '@nestjs/testing';

describe('documents', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<documents>(/* documents */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
