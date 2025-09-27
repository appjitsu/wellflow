import { Test, TestingModule } from '@nestjs/testing';

describe('CreateDrillingProgramDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<CreateDrillingProgramDto>(/* CreateDrillingProgramDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
