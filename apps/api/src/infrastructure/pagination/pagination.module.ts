import { Module } from '@nestjs/common';
import { CursorPaginationService } from './cursor-pagination.service';

/**
 * Pagination Module
 * Provides cursor-based pagination services for efficient large dataset handling
 * Follows Single Responsibility Principle - only handles pagination concerns
 */
@Module({
  providers: [CursorPaginationService],
  exports: [CursorPaginationService],
})
export class PaginationModule {}
