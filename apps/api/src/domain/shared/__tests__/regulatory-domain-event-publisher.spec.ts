import { Test, TestingModule } from '@nestjs/testing';

describe('RegulatoryDomainEventPublisher', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RegulatoryDomainEventPublisher>(/* RegulatoryDomainEventPublisher */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
