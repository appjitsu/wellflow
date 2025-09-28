import { Test, TestingModule } from '@nestjs/testing';
import { UpdateTitleOpinionStatusHandler } from '../update-title-opinion-status.handler';

describe('UpdateTitleOpinionStatusHandler', () => {
  let service: UpdateTitleOpinionStatusHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTitleOpinionStatusHandler,
        {
          provide: 'TitleOpinionRepository',
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UpdateTitleOpinionStatusHandler>(
      UpdateTitleOpinionStatusHandler,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
