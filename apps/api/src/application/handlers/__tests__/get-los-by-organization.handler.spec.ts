import { Test, TestingModule } from '@nestjs/testing';
import { GetLosByOrganizationHandler } from '../get-los-by-organization.handler';

describe('GetLosByOrganizationHandler', () => {
  let handler: GetLosByOrganizationHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetLosByOrganizationHandler,
        {
          provide: 'LosRepository',
          useValue: {
            findByOrganizationId: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetLosByOrganizationHandler>(
      GetLosByOrganizationHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
