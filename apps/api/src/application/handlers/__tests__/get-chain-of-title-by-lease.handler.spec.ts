import { Test, TestingModule } from '@nestjs/testing';
import { GetChainOfTitleByLeaseHandler } from '../get-chain-of-title-by-lease.handler';

describe('GetChainOfTitleByLeaseHandler', () => {
  let service: GetChainOfTitleByLeaseHandler;

  beforeEach(async () => {
    const mockRepo = {
      findByLeaseId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetChainOfTitleByLeaseHandler,
        {
          provide: 'ChainOfTitleRepository',
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<GetChainOfTitleByLeaseHandler>(
      GetChainOfTitleByLeaseHandler,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
