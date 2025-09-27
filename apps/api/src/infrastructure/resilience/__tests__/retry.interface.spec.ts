import { Test, TestingModule } from '@nestjs/testing';

describe('retry.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<retry.interface>(/* retry.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
