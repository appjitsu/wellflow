import { Test, TestingModule } from '@nestjs/testing';
import { GetDivisionOrderByIdHandler } from '../get-division-order-by-id.handler';

describe('GetDivisionOrderByIdHandler', () => {
  let handler: GetDivisionOrderByIdHandler;

  const mockDivisionOrderRepository = {
    findById: jest.fn(),
    findByLease: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDivisionOrderByIdHandler,
        {
          provide: 'DivisionOrderRepository',
          useValue: mockDivisionOrderRepository,
        },
      ],
    }).compile();

    handler = module.get<GetDivisionOrderByIdHandler>(
      GetDivisionOrderByIdHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
