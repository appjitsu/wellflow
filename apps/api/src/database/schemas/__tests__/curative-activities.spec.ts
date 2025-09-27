import { Test, TestingModule } from '@nestjs/testing';

describe('curative-activities', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<curative-activities>(/* curative-activities */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

