import { Test, TestingModule } from '@nestjs/testing';

describe('reserves', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<reserves>(/* reserves */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
