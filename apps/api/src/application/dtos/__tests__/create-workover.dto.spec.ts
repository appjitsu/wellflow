import { Test, TestingModule } from '@nestjs/testing';

describe('CreateWorkoverDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<CreateWorkoverDto>(/* CreateWorkoverDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
