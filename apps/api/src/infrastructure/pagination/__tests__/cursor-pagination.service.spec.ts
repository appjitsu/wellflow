import { Test, TestingModule } from '@nestjs/testing';
import { CursorPaginationService } from '../cursor-pagination.service';

describe('CursorPaginationService', () => {
  let service: CursorPaginationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CursorPaginationService],
    }).compile();

    service = module.get<CursorPaginationService>(CursorPaginationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
