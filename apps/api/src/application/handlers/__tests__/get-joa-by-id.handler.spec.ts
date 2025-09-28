import { Test, TestingModule } from '@nestjs/testing';
import { GetJoaByIdHandler } from '../get-joa-by-id.handler';

describe('GetJoaByIdHandler', () => {
  let service: GetJoaByIdHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetJoaByIdHandler,
        {
          provide: 'JoaRepository',
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GetJoaByIdHandler>(GetJoaByIdHandler);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
