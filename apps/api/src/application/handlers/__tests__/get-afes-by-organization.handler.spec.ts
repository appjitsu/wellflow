import { Test, TestingModule } from '@nestjs/testing';
import { GetAfesByOrganizationHandler } from '../get-afes-by-organization.handler';
import { IAfeRepository } from '../../../domain/repositories/afe.repository.interface';

describe('GetAfesByOrganizationHandler', () => {
  let handler: GetAfesByOrganizationHandler;
  let afeRepository: IAfeRepository;

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
    afeRepository = module.get('AfeRepository');
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
