import { Test, TestingModule } from '@nestjs/testing';

describe('partners', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<partners>(/* partners */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
