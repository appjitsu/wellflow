import { Test, TestingModule } from '@nestjs/testing';
import { GetDrillingProgramsByOrganizationHandler } from '../get-drilling-programs-by-organization.handler';

describe('GetDrillingProgramsByOrganizationHandler', () => {
  let handler: GetDrillingProgramsByOrganizationHandler;

  beforeEach(async () => {
    const mockRepository = {
      findByOrganizationId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDrillingProgramsByOrganizationHandler,
        {
          provide: 'DrillingProgramRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<GetDrillingProgramsByOrganizationHandler>(
      GetDrillingProgramsByOrganizationHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
