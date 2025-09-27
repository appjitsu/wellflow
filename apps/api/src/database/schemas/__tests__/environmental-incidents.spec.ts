import { Test, TestingModule } from '@nestjs/testing';

describe('environmental-incidents', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<environmental-incidents>(/* environmental-incidents */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

