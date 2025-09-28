import { Test, TestingModule } from '@nestjs/testing';
import { HSEIncidentRepositoryImpl } from '../hse-incident.repository';
import { DatabaseService } from '../../../database/database.service';

describe('HSEIncidentRepositoryImpl', () => {
  let service: HSEIncidentRepositoryImpl;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HSEIncidentRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: {
            getDb: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HSEIncidentRepositoryImpl>(HSEIncidentRepositoryImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
