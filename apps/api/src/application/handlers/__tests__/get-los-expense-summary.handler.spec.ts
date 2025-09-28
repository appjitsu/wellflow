import { Test, TestingModule } from '@nestjs/testing';
import { GetLosExpenseSummaryHandler } from '../get-los-expense-summary.handler';
import { ILosRepository } from '../../../domain/repositories/lease-operating-statement.repository.interface';

describe('GetLosExpenseSummaryHandler', () => {
  let handler: GetLosExpenseSummaryHandler;
  let losRepository: ILosRepository;

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
    losRepository = module.get('LosRepository');
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
