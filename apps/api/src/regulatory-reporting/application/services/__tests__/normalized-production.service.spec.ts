import { Test, TestingModule } from '@nestjs/testing';
import { NormalizedProductionService } from '../normalized-production.service';

describe('NormalizedProductionService', () => {
  let service: NormalizedProductionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NormalizedProductionService,
        {
          provide: 'ProductionRepository',
          useValue: {
            findByOrganizationAndDateRange: jest.fn(),
          },
        },
        {
          provide: 'WellRepository',
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NormalizedProductionService>(
      NormalizedProductionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
