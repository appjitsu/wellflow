import { Test, TestingModule } from '@nestjs/testing';
import { GetTitleOpinionByIdHandler } from '../get-title-opinion-by-id.handler';

describe('GetTitleOpinionByIdHandler', () => {
  let handler: GetTitleOpinionByIdHandler;

  beforeEach(async () => {
    const mockTitleOpinionRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTitleOpinionByIdHandler,
        {
          provide: 'TitleOpinionRepository',
          useValue: mockTitleOpinionRepository,
        },
      ],
    }).compile();

    handler = module.get<GetTitleOpinionByIdHandler>(
      GetTitleOpinionByIdHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
