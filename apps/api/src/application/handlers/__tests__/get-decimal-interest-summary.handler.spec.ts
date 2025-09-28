import { Test, TestingModule } from '@nestjs/testing';
import { GetDecimalInterestSummaryHandler } from '../get-decimal-interest-summary.handler';

describe('GetDecimalInterestSummaryHandler', () => {
  let service: GetDecimalInterestSummaryHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDecimalInterestSummaryHandler,
        {
          provide: 'DivisionOrderRepository',
          useValue: {
            getDecimalInterestSummary: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GetDecimalInterestSummaryHandler>(
      GetDecimalInterestSummaryHandler,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
