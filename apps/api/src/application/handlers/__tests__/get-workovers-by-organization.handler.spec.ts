import { Test, TestingModule } from '@nestjs/testing';
import { GetWorkoversByOrganizationHandler } from '../get-workovers-by-organization.handler';

describe('GetWorkoversByOrganizationHandler', () => {
  let handler: GetWorkoversByOrganizationHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetWorkoversByOrganizationHandler,
        {
          provide: 'WorkoverRepository',
          useValue: {
            findByOrganizationId: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetWorkoversByOrganizationHandler>(
      GetWorkoversByOrganizationHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
