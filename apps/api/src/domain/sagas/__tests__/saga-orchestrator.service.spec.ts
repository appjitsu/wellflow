import { Test, TestingModule } from '@nestjs/testing';
import { SagaOrchestratorService } from '../saga-orchestrator.service';
import { RegulatoryUnitOfWork } from '../../../infrastructure/repositories/regulatory-unit-of-work';
import { RegulatoryDomainEventPublisher } from '../../shared/regulatory-domain-event-publisher';

describe('SagaOrchestratorService', () => {
  let service: SagaOrchestratorService;

  beforeEach(async () => {
    const mockUnitOfWork = {} as jest.Mocked<RegulatoryUnitOfWork>;
    const mockEventPublisher =
      {} as jest.Mocked<RegulatoryDomainEventPublisher>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SagaOrchestratorService,
        {
          provide: RegulatoryUnitOfWork,
          useValue: mockUnitOfWork,
        },
        {
          provide: RegulatoryDomainEventPublisher,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    service = module.get<SagaOrchestratorService>(SagaOrchestratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
