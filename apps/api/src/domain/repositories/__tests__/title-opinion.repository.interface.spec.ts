import { Test, TestingModule } from '@nestjs/testing';

describe('title-opinion.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<title-opinion.repository.interface>(/* title-opinion.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

