import { Test, TestingModule } from '@nestjs/testing';

describe('HSEIncidentRepositoryImpl', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<HSEIncidentRepositoryImpl>(/* HSEIncidentRepositoryImpl */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
