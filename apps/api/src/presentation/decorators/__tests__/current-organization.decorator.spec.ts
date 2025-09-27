import { Test, TestingModule } from '@nestjs/testing';

describe('current-organization.decorator', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<current-organization.decorator>(/* current-organization.decorator */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

