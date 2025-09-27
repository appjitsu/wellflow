import { Test, TestingModule } from '@nestjs/testing';

describe('observer.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<observer.interface>(/* observer.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
