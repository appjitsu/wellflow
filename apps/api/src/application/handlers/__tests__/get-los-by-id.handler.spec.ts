import { Test, TestingModule } from '@nestjs/testing';

describe('GetLosByIdHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetLosByIdHandler>(/* GetLosByIdHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
