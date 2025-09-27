import { Test, TestingModule } from '@nestjs/testing';

describe('DatabaseConnectionService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<DatabaseConnectionService>(/* DatabaseConnectionService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
