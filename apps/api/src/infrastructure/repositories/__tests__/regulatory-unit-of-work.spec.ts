import { Test, TestingModule } from '@nestjs/testing';
import { RegulatoryUnitOfWork } from '../regulatory-unit-of-work';
import { DatabaseService } from '../../../database/database.service';
import { RegulatoryDomainEventPublisher } from '../../../domain/shared/regulatory-domain-event-publisher';

describe('RegulatoryUnitOfWork', () => {
  let service: RegulatoryUnitOfWork;

  beforeEach(async () => {
    const mockDatabaseService = {
      getDb: jest.fn(),
    };
    const mockEventPublisher = {
      publish: jest.fn(),
      publishMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegulatoryUnitOfWork,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: RegulatoryDomainEventPublisher,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    service = module.get<RegulatoryUnitOfWork>(RegulatoryUnitOfWork);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
