import { Test, TestingModule } from '@nestjs/testing';
import { UpdateTitleOpinionFindingsHandler } from '../update-title-opinion-findings.handler';

describe('UpdateTitleOpinionFindingsHandler', () => {
  let handler: UpdateTitleOpinionFindingsHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTitleOpinionFindingsHandler,
        {
          provide: 'TitleOpinionRepository',
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<UpdateTitleOpinionFindingsHandler>(
      UpdateTitleOpinionFindingsHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
