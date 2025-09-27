import { Test, TestingModule } from '@nestjs/testing';

describe('drilling-program.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<drilling-program.repository.interface>(/* drilling-program.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

