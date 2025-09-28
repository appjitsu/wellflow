import { Test, TestingModule } from '@nestjs/testing';
import { GetOwnerPaymentByIdHandler } from '../get-owner-payment-by-id.handler';

describe('GetOwnerPaymentByIdHandler', () => {
  let handler: GetOwnerPaymentByIdHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOwnerPaymentByIdHandler,
        {
          provide: 'OwnerPaymentRepository',
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetOwnerPaymentByIdHandler>(
      GetOwnerPaymentByIdHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
