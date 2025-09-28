import { Test, TestingModule } from '@nestjs/testing';
import { GetAfesByOrganizationHandler } from '../get-afes-by-organization.handler';

describe('GetAfesByOrganizationHandler', () => {
  let handler: GetAfesByOrganizationHandler;

  beforeEach(async () => {
    const mockAfeRepository = {
      findByOrganizationId: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAfesByOrganizationHandler,
        {
          provide: 'AfeRepository',
          useValue: mockAfeRepository,
        },
      ],
    }).compile();

    handler = module.get<GetAfesByOrganizationHandler>(
      GetAfesByOrganizationHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
