import { Test, TestingModule } from '@nestjs/testing';

describe('action.enum', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<action.enum>(/* action.enum */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
