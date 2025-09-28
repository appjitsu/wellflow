import { Test, TestingModule } from '@nestjs/testing';
import { AdapterRegistryService } from '../adapter-registry.service';
import { TxRrcPrAdapter } from '../../../infrastructure/adapters/tx-rrc-pr.adapter';

describe('AdapterRegistryService', () => {
  let service: AdapterRegistryService;

  beforeEach(async () => {
    const mockAdapter = {
      submitReport: jest.fn(),
      getStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdapterRegistryService,
        {
          provide: TxRrcPrAdapter,
          useValue: mockAdapter,
        },
      ],
    }).compile();

    service = module.get<AdapterRegistryService>(AdapterRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
