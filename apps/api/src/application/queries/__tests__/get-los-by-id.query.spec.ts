import { Test, TestingModule } from '@nestjs/testing';

describe('GetLosByIdQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetLosByIdQuery>(/* GetLosByIdQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
