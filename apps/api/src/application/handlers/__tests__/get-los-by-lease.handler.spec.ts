import { Test, TestingModule } from '@nestjs/testing';
import { GetLosByLeaseHandler } from '../get-los-by-lease.handler';

describe('GetLosByLeaseHandler', () => {
  let service: GetLosByLeaseHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetLosByLeaseHandler,
        {
          provide: 'LosRepository',
          useValue: {
            findByLeaseId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GetLosByLeaseHandler>(GetLosByLeaseHandler);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
