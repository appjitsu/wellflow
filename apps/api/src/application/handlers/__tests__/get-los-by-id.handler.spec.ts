import { Test, TestingModule } from '@nestjs/testing';
import { GetLosByIdHandler } from '../get-los-by-id.handler';

describe('GetLosByIdHandler', () => {
  let service: GetLosByIdHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetLosByIdHandler,
        {
          provide: 'LosRepository',
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GetLosByIdHandler>(GetLosByIdHandler);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
