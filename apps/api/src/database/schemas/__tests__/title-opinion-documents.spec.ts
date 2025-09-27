import { Test, TestingModule } from '@nestjs/testing';

describe('title-opinion-documents', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<title-opinion-documents>(/* title-opinion-documents */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

