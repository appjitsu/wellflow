import { Test, TestingModule } from '@nestjs/testing';
import { JibLinkingService } from '../jib-linking.service';

describe('JibLinkingService', () => {
  let service: JibLinkingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JibLinkingService],
    }).compile();

    service = module.get<JibLinkingService>(JibLinkingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
