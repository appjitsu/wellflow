import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegulatoryOutboxService } from '../events/regulatory-outbox.service';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import { CheckAbilities } from '../../authorization/abilities.decorator';

@ApiTags('Regulatory Outbox')
@ApiBearerAuth()
@Controller('regulatory/outbox')
@UseGuards(AbilitiesGuard)
export class RegulatoryOutboxController {
  constructor(private readonly outboxService: RegulatoryOutboxService) {}

  @Get('stats')
  @CheckAbilities({ action: 'audit', subject: 'all' })
  @ApiOperation({
    summary: 'Get outbox processing statistics',
    description:
      'Retrieve statistics about outbox event processing for the last 30 days',
  })
  @ApiResponse({
    status: 200,
    description: 'Outbox processing statistics',
    schema: {
      type: 'object',
      properties: {
        pending: { type: 'number', description: 'Number of pending events' },
        processed: {
          type: 'number',
          description: 'Number of processed events',
        },
        failed: { type: 'number', description: 'Number of failed events' },
        totalAttempts: {
          type: 'number',
          description: 'Total processing attempts',
        },
      },
    },
  })
  async getProcessingStats() {
    return await this.outboxService.getProcessingStats();
  }

  @Post('retry-failed')
  @CheckAbilities({ action: 'audit', subject: 'all' })
  @ApiOperation({
    summary: 'Retry failed outbox events',
    description: 'Manually retry processing of failed outbox events',
  })
  @ApiResponse({
    status: 200,
    description: 'Failed events have been queued for retry',
  })
  async retryFailedEvents(@Body() body?: { eventIds?: string[] }) {
    await this.outboxService.retryFailedEvents(body?.eventIds);
    return { message: 'Failed events have been queued for retry' };
  }

  @Post('process-pending')
  @CheckAbilities({ action: 'audit', subject: 'all' })
  @ApiOperation({
    summary: 'Process pending outbox events',
    description: 'Manually trigger processing of pending outbox events',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending events have been processed',
  })
  async processPendingEvents() {
    await this.outboxService.processPendingEvents();
    return { message: 'Pending events have been processed' };
  }

  @Post('retry/:eventId')
  @CheckAbilities({ action: 'audit', subject: 'all' })
  @ApiOperation({
    summary: 'Retry a specific failed event',
    description: 'Manually retry processing of a specific failed outbox event',
  })
  @ApiResponse({
    status: 200,
    description: 'Event has been queued for retry',
  })
  async retrySpecificEvent(@Param('eventId') eventId: string) {
    await this.outboxService.retryFailedEvents([eventId]);
    return { message: `Event ${eventId} has been queued for retry` };
  }
}
