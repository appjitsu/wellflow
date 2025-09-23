import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { SQL, and, or, gt, lt, eq, desc, asc } from 'drizzle-orm';
import type { AnyPgColumn, PgTable, TableConfig } from 'drizzle-orm/pg-core';

/**
 * Cursor Pagination Request Schema
 * Validates cursor-based pagination parameters
 */
export const CursorPaginationRequestSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  direction: z.enum(['forward', 'backward']).default('forward'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CursorPaginationRequest = z.infer<
  typeof CursorPaginationRequestSchema
>;

/**
 * Cursor Pagination Response Interface
 * Standardized response format for cursor-based pagination
 */
export interface CursorPaginationResponse<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
    totalCount?: number; // Optional, expensive to calculate
  };
  meta: {
    limit: number;
    direction: 'forward' | 'backward';
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  };
}

/**
 * Cursor Configuration Interface
 * Defines how to extract cursor values from records
 */
export interface CursorConfig<T> {
  // Primary cursor field (usually id or timestamp)
  primaryField: keyof T;
  // Secondary cursor field for tie-breaking (optional)
  secondaryField?: keyof T;
  // Custom cursor encoder/decoder
  encodeCursor?: (record: T) => string;
  decodeCursor?: (cursor: string) => { primary: unknown; secondary?: unknown };
}

/**
 * Cursor Pagination Service
 * Implements efficient cursor-based pagination for large datasets
 * Follows Single Responsibility Principle - only handles pagination logic
 */
@Injectable()
export class CursorPaginationService {
  /**
   * Create cursor-based pagination query conditions
   * Optimized for performance with proper index usage
   */
  createCursorConditions<T extends PgTable<TableConfig>>(
    table: T,
    request: CursorPaginationRequest,
    config: CursorConfig<T['$inferSelect']>,
    filters?: SQL[],
  ): {
    conditions: SQL[];
    orderBy: SQL[];
    limit: number;
  } {
    const conditions: SQL[] = filters ? [...filters] : [];
    const orderBy: SQL[] = [];
    const { cursor, direction, sortOrder, limit } = request;

    // Get column references
    const primaryColumn = table[config.primaryField as string] as AnyPgColumn;
    const secondaryColumn = config.secondaryField
      ? (table[config.secondaryField as string] as AnyPgColumn)
      : null;

    // Add cursor conditions if cursor is provided
    if (cursor) {
      const cursorData = config.decodeCursor
        ? config.decodeCursor(cursor)
        : this.decodeCursor(cursor);

      this.addCursorConditions(
        conditions,
        primaryColumn,
        secondaryColumn,
        cursorData,
        direction,
        sortOrder,
      );
    }

    this.addOrdering(
      orderBy,
      primaryColumn,
      secondaryColumn,
      sortOrder,
      direction,
    );

    return {
      conditions,
      orderBy,
      limit: limit + 1, // +1 to check for next/previous page
    };
  }

  private addCursorConditions(
    conditions: SQL[],
    primaryColumn: AnyPgColumn,
    secondaryColumn: AnyPgColumn | null,
    cursorData: { primary: unknown; secondary?: unknown },
    direction: 'forward' | 'backward',
    sortOrder: 'asc' | 'desc',
  ): void {
    if (direction === 'forward') {
      this.addForwardCursorConditions(
        conditions,
        primaryColumn,
        secondaryColumn,
        cursorData,
        sortOrder,
      );
    } else {
      this.addBackwardCursorConditions(
        conditions,
        primaryColumn,
        secondaryColumn,
        cursorData,
        sortOrder,
      );
    }
  }

  private addForwardCursorConditions(
    conditions: SQL[],
    primaryColumn: AnyPgColumn,
    secondaryColumn: AnyPgColumn | null,
    cursorData: { primary: unknown; secondary?: unknown },
    sortOrder: 'asc' | 'desc',
  ): void {
    if (sortOrder === 'desc') {
      this.addForwardDescConditions(
        conditions,
        primaryColumn,
        secondaryColumn,
        cursorData,
      );
    } else {
      this.addForwardAscConditions(
        conditions,
        primaryColumn,
        secondaryColumn,
        cursorData,
      );
    }
  }

  private addForwardDescConditions(
    conditions: SQL[],
    primaryColumn: AnyPgColumn,
    secondaryColumn: AnyPgColumn | null,
    cursorData: { primary: unknown; secondary?: unknown },
  ): void {
    if (secondaryColumn && cursorData.secondary !== undefined) {
      conditions.push(
        or(
          lt(primaryColumn, cursorData.primary),
          and(
            eq(primaryColumn, cursorData.primary),
            lt(secondaryColumn, cursorData.secondary),
          ),
        ),
      );
    } else {
      conditions.push(lt(primaryColumn, cursorData.primary));
    }
  }

  private addForwardAscConditions(
    conditions: SQL[],
    primaryColumn: AnyPgColumn,
    secondaryColumn: AnyPgColumn | null,
    cursorData: { primary: unknown; secondary?: unknown },
  ): void {
    if (secondaryColumn && cursorData.secondary !== undefined) {
      const condition = or(
        gt(primaryColumn, cursorData.primary),
        and(
          eq(primaryColumn, cursorData.primary),
          gt(secondaryColumn, cursorData.secondary),
        ),
      );
      if (condition) {
        conditions.push(condition);
      }
    } else {
      conditions.push(gt(primaryColumn, cursorData.primary));
    }
  }

  private addBackwardCursorConditions(
    conditions: SQL[],
    primaryColumn: AnyPgColumn,
    secondaryColumn: AnyPgColumn | null,
    cursorData: { primary: unknown; secondary?: unknown },
    sortOrder: 'asc' | 'desc',
  ): void {
    if (sortOrder === 'desc') {
      this.addBackwardDescConditions(
        conditions,
        primaryColumn,
        secondaryColumn,
        cursorData,
      );
    } else {
      this.addBackwardAscConditions(
        conditions,
        primaryColumn,
        secondaryColumn,
        cursorData,
      );
    }
  }

  // eslint-disable-next-line sonarjs/no-identical-functions
  private addBackwardDescConditions(
    conditions: SQL[],
    primaryColumn: AnyPgColumn,
    secondaryColumn: AnyPgColumn | null,
    cursorData: { primary: unknown; secondary?: unknown },
  ): void {
    if (secondaryColumn && cursorData.secondary !== undefined) {
      const condition = or(
        gt(primaryColumn, cursorData.primary),
        and(
          eq(primaryColumn, cursorData.primary),
          gt(secondaryColumn, cursorData.secondary),
        ),
      );
      if (condition) {
        conditions.push(condition);
      }
    } else {
      conditions.push(gt(primaryColumn, cursorData.primary));
    }
  }

  private addBackwardAscConditions(
    conditions: SQL[],
    primaryColumn: AnyPgColumn,
    secondaryColumn: AnyPgColumn | null,
    cursorData: { primary: unknown; secondary?: unknown },
  ): void {
    if (secondaryColumn && cursorData.secondary !== undefined) {
      const condition = or(
        lt(primaryColumn, cursorData.primary),
        and(
          eq(primaryColumn, cursorData.primary),
          lt(secondaryColumn, cursorData.secondary),
        ),
      );
      if (condition) {
        conditions.push(condition);
      }
    } else {
      conditions.push(lt(primaryColumn, cursorData.primary));
    }
  }

  private addOrdering(
    orderBy: SQL[],
    primaryColumn: AnyPgColumn,
    secondaryColumn: AnyPgColumn | null,
    sortOrder: 'asc' | 'desc',
    direction: 'forward' | 'backward',
  ): void {
    if (sortOrder === 'desc') {
      orderBy.push(desc(primaryColumn));
      if (secondaryColumn) {
        orderBy.push(desc(secondaryColumn));
      }
    } else {
      orderBy.push(asc(primaryColumn));
      if (secondaryColumn) {
        orderBy.push(asc(secondaryColumn));
      }
    }

    // For backward pagination, we need to reverse the order and then reverse results
    if (direction === 'backward') {
      orderBy.reverse();
    }
  }

  /**
   * Process pagination results and create response
   * Handles cursor generation and pagination metadata
   */
  createPaginationResponse<T>(
    records: T[],
    request: CursorPaginationRequest,
    config: CursorConfig<T>,
    totalCount?: number,
  ): CursorPaginationResponse<T> {
    const { limit, direction } = request;

    // Check if there are more records
    const hasMore = records.length > limit;
    const data = hasMore ? records.slice(0, limit) : records;

    // Reverse data if backward pagination
    if (direction === 'backward') {
      data.reverse();
    }

    // Generate cursors
    const nextCursor = this.generateCursor(data, config, 'next');
    const previousCursor = this.generateCursor(data, config, 'previous');

    // Determine pagination state
    const hasNextPage = direction === 'forward' ? hasMore : !!request.cursor;
    const hasPreviousPage =
      direction === 'backward' ? hasMore : !!request.cursor;

    return {
      data,
      pagination: {
        hasNextPage,
        hasPreviousPage,
        nextCursor: hasNextPage ? nextCursor : null,
        previousCursor: hasPreviousPage ? previousCursor : null,
        totalCount,
      },
      meta: {
        limit,
        direction,
        sortBy: request.sortBy,
        sortOrder: request.sortOrder,
      },
    };
  }

  /**
   * Generate cursor from record data
   */
  private generateCursor<T>(
    data: T[],
    config: CursorConfig<T>,
    position: 'next' | 'previous',
  ): string | null {
    if (data.length === 0) return null;

    const record = position === 'next' ? data[data.length - 1] : data[0];

    if (config.encodeCursor) {
      return config.encodeCursor(record);
    }

    return this.encodeCursor(record, config);
  }

  /**
   * Default cursor encoder
   * Creates a base64-encoded cursor with primary and secondary values
   */
  private encodeCursor<T>(record: T, config: CursorConfig<T>): string {
    const cursorData: { primary: unknown; secondary?: unknown } = {
      primary: record[config.primaryField],
    };

    if (config.secondaryField) {
      cursorData.secondary = record[config.secondaryField];
    }

    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  /**
   * Default cursor decoder
   * Decodes base64-encoded cursor back to values
   */
  private decodeCursor(cursor: string): {
    primary: unknown;
    secondary?: unknown;
  } {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded) as {
        primary: unknown;
        secondary?: unknown;
      };

      // Validate the structure

      if (
        parsed == null ||
        typeof parsed !== 'object' ||
        !('primary' in parsed)
      ) {
        throw new Error('Invalid cursor structure');
      }

      return parsed;
    } catch (error) {
      throw new Error(
        `Invalid cursor format: ${cursor}. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Validate pagination request
   */
  validatePaginationRequest(request: unknown): CursorPaginationRequest {
    const result = CursorPaginationRequestSchema.safeParse(request);

    if (!result.success) {
      throw new Error(`Invalid pagination request: ${result.error.message}`);
    }

    return result.data;
  }

  /**
   * Create optimized cursor configuration for common use cases
   */
  createTimestampCursorConfig<T>(
    primaryField: keyof T,
    secondaryField?: keyof T,
  ): CursorConfig<T> {
    return {
      primaryField,
      secondaryField,
      encodeCursor: (record: T) => {
        // eslint-disable-next-line security/detect-object-injection
        const primary = record[primaryField];
        // eslint-disable-next-line security/detect-object-injection
        const secondary = secondaryField ? record[secondaryField] : undefined;

        // For timestamps, use ISO string for better readability
        const cursorData = {
          primary: primary instanceof Date ? primary.toISOString() : primary,
          secondary:
            secondary instanceof Date ? secondary.toISOString() : secondary,
        };

        return Buffer.from(JSON.stringify(cursorData)).toString('base64');
      },
      decodeCursor: (cursor: string) => {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        const data = JSON.parse(decoded) as {
          primary: unknown;
          secondary?: unknown;
        };

        return {
          primary:
            typeof data.primary === 'string' && data.primary.includes('T')
              ? new Date(data.primary)
              : data.primary,
          secondary:
            data.secondary &&
            typeof data.secondary === 'string' &&
            data.secondary.includes('T')
              ? new Date(data.secondary)
              : data.secondary,
        };
      },
    };
  }

  /**
   * Create cursor configuration for UUID-based pagination
   */
  createUuidCursorConfig<T>(
    primaryField: keyof T,
    secondaryField?: keyof T,
  ): CursorConfig<T> {
    return {
      primaryField,
      secondaryField,
    };
  }
}
