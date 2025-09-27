import { Test, TestingModule } from '@nestjs/testing';

describe('environmental-incident.enums', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<environmental-incident.enums>(/* environmental-incident.enums */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

