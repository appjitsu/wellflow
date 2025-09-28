import { Test, TestingModule } from '@nestjs/testing';
import { TxRrcPrAdapter } from '../tx-rrc-pr.adapter';
import { NormalizedProductionService } from '../../../application/services/normalized-production.service';

describe('TxRrcPrAdapter', () => {
  let service: TxRrcPrAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TxRrcPrAdapter,
        {
          provide: NormalizedProductionService,
          useValue: {
            normalizeProductionData: jest.fn(),
          },
        },
        {
          provide: 'OrganizationRepository',
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TxRrcPrAdapter>(TxRrcPrAdapter);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
