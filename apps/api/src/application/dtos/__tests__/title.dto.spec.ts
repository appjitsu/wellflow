import { Test, TestingModule } from '@nestjs/testing';

describe('CreateTitleOpinionDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<CreateTitleOpinionDto>(/* CreateTitleOpinionDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
