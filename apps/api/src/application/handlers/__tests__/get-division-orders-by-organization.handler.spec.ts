import { Test, TestingModule } from '@nestjs/testing';
import { GetDivisionOrdersByOrganizationHandler } from '../get-division-orders-by-organization.handler';

describe('GetDivisionOrdersByOrganizationHandler', () => {
  let handler: GetDivisionOrdersByOrganizationHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDivisionOrdersByOrganizationHandler,
        {
          provide: 'DivisionOrderRepository',
          useValue: {
            findByOrganizationId: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetDivisionOrdersByOrganizationHandler>(
      GetDivisionOrdersByOrganizationHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
