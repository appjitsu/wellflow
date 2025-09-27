import { Test, TestingModule } from '@nestjs/testing';

describe('chain-of-title.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<chain-of-title.repository.interface>(/* chain-of-title.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

