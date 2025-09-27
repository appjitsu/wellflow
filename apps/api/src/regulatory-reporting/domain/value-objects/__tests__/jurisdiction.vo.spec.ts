import { Test, TestingModule } from '@nestjs/testing';

describe('jurisdiction.vo', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<jurisdiction.vo>(/* jurisdiction.vo */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
