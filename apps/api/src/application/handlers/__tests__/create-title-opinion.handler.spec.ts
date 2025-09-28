import { Test, TestingModule } from '@nestjs/testing';
import { CreateTitleOpinionHandler } from '../create-title-opinion.handler';

describe('CreateTitleOpinionHandler', () => {
  let handler: CreateTitleOpinionHandler;

  const mockTitleOpinionRepository = {
    findByOpinionNumber: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTitleOpinionHandler,
        {
          provide: 'TitleOpinionRepository',
          useValue: mockTitleOpinionRepository,
        },
      ],
    }).compile();

    handler = module.get<CreateTitleOpinionHandler>(CreateTitleOpinionHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
