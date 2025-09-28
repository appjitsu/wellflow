import { Test, TestingModule } from '@nestjs/testing';
import { RegulatoryDomainEventPublisher } from '../regulatory-domain-event-publisher';

describe('RegulatoryDomainEventPublisher', () => {
  let service: RegulatoryDomainEventPublisher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegulatoryDomainEventPublisher,
        {
          provide: 'RegulatoryEventPublisher',
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RegulatoryDomainEventPublisher>(
      RegulatoryDomainEventPublisher,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
