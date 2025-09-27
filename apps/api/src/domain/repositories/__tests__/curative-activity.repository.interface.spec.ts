import { Test, TestingModule } from '@nestjs/testing';

describe('curative-activity.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<curative-activity.repository.interface>(/* curative-activity.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

