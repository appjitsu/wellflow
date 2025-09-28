import { Test, TestingModule } from '@nestjs/testing';
import { GetCurativeItemsByTitleOpinionHandler } from '../get-curative-items-by-title-opinion.handler';

describe('GetCurativeItemsByTitleOpinionHandler', () => {
  let service: GetCurativeItemsByTitleOpinionHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCurativeItemsByTitleOpinionHandler,
        {
          provide: 'CurativeItemRepository',
          useValue: {
            findByTitleOpinionId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GetCurativeItemsByTitleOpinionHandler>(
      GetCurativeItemsByTitleOpinionHandler,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
