import { Test, TestingModule } from '@nestjs/testing';

describe('workovers', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<workovers>(/* workovers */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
