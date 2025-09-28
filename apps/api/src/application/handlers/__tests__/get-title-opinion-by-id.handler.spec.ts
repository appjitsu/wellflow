import { Test, TestingModule } from '@nestjs/testing';
import { GetTitleOpinionByIdHandler } from '../get-title-opinion-by-id.handler';
import { TitleOpinionRepository } from '../../../domain/repositories/title-opinion.repository.interface';

describe('GetTitleOpinionByIdHandler', () => {
  let handler: GetTitleOpinionByIdHandler;
  let titleOpinionRepository: TitleOpinionRepository;

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
    titleOpinionRepository = module.get('TitleOpinionRepository');
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
