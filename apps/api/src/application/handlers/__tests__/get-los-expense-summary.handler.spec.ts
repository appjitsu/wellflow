import { Test, TestingModule } from '@nestjs/testing';
import { GetLosExpenseSummaryHandler } from '../get-los-expense-summary.handler';

describe('GetLosExpenseSummaryHandler', () => {
  let handler: GetLosExpenseSummaryHandler;

  beforeEach(async () => {
    const mockLosRepository = {
      getExpenseSummaryByLease: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetLosExpenseSummaryHandler,
        {
          provide: 'LosRepository',
          useValue: mockLosRepository,
        },
      ],
    }).compile();

    handler = module.get<GetLosExpenseSummaryHandler>(
      GetLosExpenseSummaryHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
