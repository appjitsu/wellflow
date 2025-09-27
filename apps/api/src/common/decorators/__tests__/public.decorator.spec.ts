import { Test, TestingModule } from '@nestjs/testing';

describe('public.decorator', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<public.decorator>(/* public.decorator */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
