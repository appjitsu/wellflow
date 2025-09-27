import { Test, TestingModule } from '@nestjs/testing';

describe('GetWorkoverByIdQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetWorkoverByIdQuery>(/* GetWorkoverByIdQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
