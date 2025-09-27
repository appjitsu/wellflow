import { Test, TestingModule } from '@nestjs/testing';

describe('GetJoaByIdQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetJoaByIdQuery>(/* GetJoaByIdQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
