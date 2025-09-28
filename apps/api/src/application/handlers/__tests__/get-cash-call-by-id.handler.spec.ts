import { Test, TestingModule } from '@nestjs/testing';
import { GetCashCallByIdHandler } from '../get-cash-call-by-id.handler';

describe('GetCashCallByIdHandler', () => {
  let handler: GetCashCallByIdHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCashCallByIdHandler,
        {
          provide: 'CashCallRepository',
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetCashCallByIdHandler>(GetCashCallByIdHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
