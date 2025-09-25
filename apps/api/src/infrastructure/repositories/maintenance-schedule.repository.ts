import { and, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { maintenanceSchedules } from '../../database/schemas/maintenance-schedules';
import {
  MaintenanceSchedule,
  type MaintenanceStatus,
} from '../../domain/entities/maintenance-schedule.entity';
import type { IMaintenanceScheduleRepository } from '../../domain/repositories/maintenance-schedule.repository.interface';

export class MaintenanceScheduleRepository
  implements IMaintenanceScheduleRepository
{
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async save(entity: MaintenanceSchedule): Promise<MaintenanceSchedule> {
    const values: typeof maintenanceSchedules.$inferInsert = {
      id: entity.getId(),
      organizationId: entity.getOrganizationId(),
      equipmentId: entity.getEquipmentId(),
      vendorId: entity.getVendorId() ?? null,
      status: entity.getStatus(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.db
      .insert(maintenanceSchedules)
      .values(values)
      .onConflictDoUpdate({
        target: maintenanceSchedules.id,
        set: { ...values, updatedAt: new Date() },
      });
    return entity;
  }

  async findById(id: string): Promise<MaintenanceSchedule | null> {
    const [row] = await this.db
      .select()
      .from(maintenanceSchedules)
      .where(eq(maintenanceSchedules.id, id))
      .limit(1);
    if (!row) return null;
    return new MaintenanceSchedule({
      id: row.id,
      organizationId: row.organizationId,
      equipmentId: row.equipmentId,
      vendorId: row.vendorId ?? undefined,
      status: row.status,
    });
  }

  async findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      equipmentId?: string;
      status?: MaintenanceStatus;
    },
  ): Promise<MaintenanceSchedule[]> {
    const clauses = [eq(maintenanceSchedules.organizationId, organizationId)];
    if (options?.equipmentId)
      clauses.push(eq(maintenanceSchedules.equipmentId, options.equipmentId));
    if (options?.status)
      clauses.push(eq(maintenanceSchedules.status, options.status));

    const rows = await this.db
      .select()
      .from(maintenanceSchedules)
      .where(and(...clauses))
      .orderBy(desc(maintenanceSchedules.updatedAt))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0);

    return rows.map(
      (r) =>
        new MaintenanceSchedule({
          id: r.id,
          organizationId: r.organizationId,
          equipmentId: r.equipmentId,
          vendorId: r.vendorId ?? undefined,
          status: r.status,
        }),
    );
  }
}
