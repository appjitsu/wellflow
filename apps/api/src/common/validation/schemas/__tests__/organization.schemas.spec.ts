import { Test, TestingModule } from '@nestjs/testing';

describe('organization.schemas', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<organization.schemas>(/* organization.schemas */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
