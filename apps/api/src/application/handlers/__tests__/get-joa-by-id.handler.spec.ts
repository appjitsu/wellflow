import { Test, TestingModule } from '@nestjs/testing';

describe('GetJoaByIdHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetJoaByIdHandler>(/* GetJoaByIdHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
