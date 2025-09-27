import { Test, TestingModule } from '@nestjs/testing';

describe('regulator-adapter.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<regulator-adapter.interface>(/* regulator-adapter.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

