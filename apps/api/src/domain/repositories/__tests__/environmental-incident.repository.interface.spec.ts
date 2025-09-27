import { Test, TestingModule } from '@nestjs/testing';

describe('environmental-incident.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<environmental-incident.repository.interface>(/* environmental-incident.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

