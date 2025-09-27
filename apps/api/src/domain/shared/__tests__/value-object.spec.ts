import { Test, TestingModule } from '@nestjs/testing';

describe('value-object', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<value-object>(/* value-object */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

