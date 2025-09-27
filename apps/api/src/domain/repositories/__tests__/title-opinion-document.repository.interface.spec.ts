import { Test, TestingModule } from '@nestjs/testing';

describe('title-opinion-document.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<title-opinion-document.repository.interface>(/* title-opinion-document.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

