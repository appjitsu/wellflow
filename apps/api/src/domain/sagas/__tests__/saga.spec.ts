import { Test, TestingModule } from '@nestjs/testing';

describe('saga', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<saga>(/* saga */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
