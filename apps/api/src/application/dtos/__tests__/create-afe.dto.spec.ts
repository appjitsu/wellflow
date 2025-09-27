import { Test, TestingModule } from '@nestjs/testing';

describe('CreateAfeDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<CreateAfeDto>(/* CreateAfeDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
