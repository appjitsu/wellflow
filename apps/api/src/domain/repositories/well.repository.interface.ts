import { Well } from '../entities/well.entity';
import { ApiNumber } from '../value-objects/api-number';

/**
 * Well Repository Interface
 * Defines the contract for well data access
 */
export interface WellRepository {
  /**
   * Save a well (create or update)
   */
  save(well: Well): Promise<void>;

  /**
   * Find well by ID
   */
  findById(id: string): Promise<Well | null>;

  /**
   * Find well by API number
   */
  findByApiNumber(apiNumber: ApiNumber): Promise<Well | null>;

  /**
   * Find wells by operator ID
   */
  findByOperatorId(operatorId: string): Promise<Well[]>;

  /**
   * Find wells by lease ID
   */
  findByLeaseId(leaseId: string): Promise<Well[]>;

  /**
   * Find wells within a geographic area
   */
  findByLocation(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
  ): Promise<Well[]>;

  /**
   * Find wells with pagination
   */
  findWithPagination(
    offset: number,
    limit: number,
    filters?: {
      operatorId?: string;
      status?: string;
      wellType?: string;
    },
  ): Promise<{
    wells: Well[];
    total: number;
  }>;

  /**
   * Delete a well
   */
  delete(id: string): Promise<void>;

  /**
   * Check if API number exists
   */
  existsByApiNumber(apiNumber: ApiNumber): Promise<boolean>;
}
