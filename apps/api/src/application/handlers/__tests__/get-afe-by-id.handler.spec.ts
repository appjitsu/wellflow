import { Test, TestingModule } from '@nestjs/testing';

describe('GetAfeByIdHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetAfeByIdHandler>(/* GetAfeByIdHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
