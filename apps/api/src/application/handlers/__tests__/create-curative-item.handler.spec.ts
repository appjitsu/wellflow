import { Test, TestingModule } from '@nestjs/testing';

describe('CreateCurativeItemHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<CreateCurativeItemHandler>(/* CreateCurativeItemHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
