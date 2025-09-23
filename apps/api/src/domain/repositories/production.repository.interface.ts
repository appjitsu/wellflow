/**
 * Production Repository Interface
 * Defines the contract for production data access
 */
export interface ProductionRepository {
  /**
   * Create a new production record
   */
  create(data: CreateProductionRecordDto): Promise<ProductionRecord>;

  /**
   * Find production record by ID
   */
  findById(id: string): Promise<ProductionRecord | null>;

  /**
   * Find production records by well ID
   */
  findByWellId(wellId: string): Promise<ProductionRecord[]>;

  /**
   * Update production record
   */
  update(
    id: string,
    data: UpdateProductionRecordDto,
  ): Promise<ProductionRecord | null>;

  /**
   * Delete production record
   */
  delete(id: string): Promise<boolean>;
}

export interface CreateProductionRecordDto {
  wellId: string;
  productionDate: string;
  oilVolume?: string;
  gasVolume?: string;
  waterVolume?: string;
  oilPrice?: string;
  gasPrice?: string;
  runTicket?: string;
  comments?: string;
  organizationId: string;
}

export interface UpdateProductionRecordDto {
  oilVolume?: string;
  gasVolume?: string;
  waterVolume?: string;
  oilPrice?: string;
  gasPrice?: string;
  runTicket?: string;
  comments?: string;
}

export interface ProductionRecord {
  id: string;
  organizationId: string;
  wellId: string;
  productionDate: string;
  oilVolume: string | null;
  gasVolume: string | null;
  waterVolume: string | null;
  oilPrice: string | null;
  gasPrice: string | null;
  runTicket: string | null;
  comments: string | null;
  createdAt: Date;
  updatedAt: Date;
}
