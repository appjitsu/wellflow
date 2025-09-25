import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { outboxEvents } from '../../database/schemas/outbox-events';

export interface OutboxRecordEvent {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  organizationId?: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  constructor(private readonly database: DatabaseService) {}

  async record(event: OutboxRecordEvent): Promise<void> {
    const db = this.database.getDb();
    await db.insert(outboxEvents).values({
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      organizationId: event.organizationId,
      payload: event.payload as unknown as object,
      status: 'pending',
      attempts: 0,
    });
    this.logger.debug(
      `Outbox recorded: ${event.eventType} ${event.aggregateId}`,
    );
  }
}
