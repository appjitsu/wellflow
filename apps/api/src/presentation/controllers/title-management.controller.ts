import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';

import {
  CreateTitleOpinionDto,
  CreateCurativeItemDto,
  CreateChainOfTitleEntryDto,
  LinkTitleOpinionDocumentDto,
  ReassignCurativeItemDto,
  SetCurativeItemDueDateDto,
  UpdateCurativeItemStatusDto,
  UpdateTitleOpinionStatusDto,
  UpdateTitleOpinionFindingsDto,
  CurativeItemDocumentLinkDto,
  TitleOpinionDocumentLinkDto,
} from '../../application/dtos/title.dto';
import { CreateTitleOpinionCommand } from '../../application/commands/create-title-opinion.command';
import { CreateCurativeItemCommand } from '../../application/commands/create-curative-item.command';
import { AddChainOfTitleEntryCommand } from '../../application/commands/add-chain-of-title-entry.command';
import { LinkTitleOpinionDocumentCommand } from '../../application/commands/link-title-opinion-document.command';
import { UpdateCurativeItemStatusCommand } from '../../application/commands/update-curative-item-status.command';
import { ReassignCurativeItemCommand } from '../../application/commands/reassign-curative-item.command';
import { SetCurativeItemDueDateCommand } from '../../application/commands/set-curative-item-due-date.command';
import { UpdateTitleOpinionStatusCommand } from '../../application/commands/update-title-opinion-status.command';
import { UpdateTitleOpinionFindingsCommand } from '../../application/commands/update-title-opinion-findings.command';
import { GetTitleOpinionByIdQuery } from '../../application/queries/get-title-opinion-by-id.query';
import { GetCurativeItemsByTitleOpinionQuery } from '../../application/queries/get-curative-items-by-title-opinion.query';
import { GetChainOfTitleByLeaseQuery } from '../../application/queries/get-chain-of-title-by-lease.query';
import { GetCurativeItemDocumentsQuery } from '../../application/queries/get-curative-item-documents.query';
import { GetTitleOpinionDocumentsQuery } from '../../application/queries/get-title-opinion-documents.query';
import { TitleStatus } from '../../domain/entities/title-opinion.entity';
import { CurativeStatus } from '../../domain/entities/curative-item.entity';
import { CurrentOrganization } from '../decorators/current-organization.decorator';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';

const CURATIVE_ITEM_NOT_FOUND_MESSAGE = 'Curative item not found';

@ApiTags('Title Management')
@ApiBearerAuth()
@Controller('title')
@UseGuards(TenantGuard, AbilitiesGuard)
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class TitleManagementController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('opinions')
  @ApiOperation({ summary: 'Create a new title opinion' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Title opinion created',
  })
  async createTitleOpinion(
    @CurrentOrganization() organizationId: string,
    @Body() dto: CreateTitleOpinionDto,
  ): Promise<{ id: string; message: string }> {
    const id: string = await this.commandBus.execute(
      new CreateTitleOpinionCommand(
        organizationId,
        dto.leaseId,
        dto.opinionNumber,
        dto.examinerName,
        new Date(dto.examinationDate),
        new Date(dto.effectiveDate),
        dto.titleStatus as unknown as TitleStatus,
        dto.findings,
        dto.recommendations,
      ),
    );
    return { id, message: 'Title opinion created' };
  }

  @Get('opinions/:id')
  @ApiOperation({ summary: 'Get a title opinion by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Title opinion retrieved',
  })
  async getTitleOpinion(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.queryBus.execute(
      new GetTitleOpinionByIdQuery(id, organizationId),
    );
  }

  @Post('curative-items')
  @ApiOperation({ summary: 'Create a curative item' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Curative item created',
  })
  async createCurativeItem(
    @CurrentOrganization() organizationId: string,
    @Body() dto: CreateCurativeItemDto,
  ): Promise<{ id: string; message: string }> {
    const id: string = await this.commandBus.execute(
      new CreateCurativeItemCommand(
        dto.titleOpinionId,
        organizationId,
        dto.itemNumber,
        dto.defectType,
        dto.description,
        dto.priority,
      ),
    );
    return { id, message: 'Curative item created' };
  }

  @Get('opinions/:id/curative-items')
  @ApiOperation({ summary: 'List curative items for a title opinion' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getCurativeItems(
    @CurrentOrganization() organizationId: string,
    @Param('id') titleOpinionId: string,
    @Query('status') status?: CurativeStatus,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.queryBus.execute(
      new GetCurativeItemsByTitleOpinionQuery(
        titleOpinionId,
        organizationId,
        status,
        page,
        limit,
      ),
    );
  }

  @Put('curative-items/:id/status')
  @ApiOperation({ summary: 'Update curative item status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Curative item status updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: CURATIVE_ITEM_NOT_FOUND_MESSAGE,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition or validation error',
  })
  async updateCurativeItemStatus(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCurativeItemStatusDto,
  ): Promise<{ message: string }> {
    await this.commandBus.execute(
      new UpdateCurativeItemStatusCommand(
        id,
        organizationId,
        dto.status as unknown as CurativeStatus,
        dto.resolutionNotes,
        dto.updatedBy,
      ),
    );
    return { message: 'Curative item status updated' };
  }

  @Put('curative-items/:id/assign')
  @ApiOperation({ summary: 'Reassign curative item' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Curative item reassigned',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: CURATIVE_ITEM_NOT_FOUND_MESSAGE,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async reassignCurativeItem(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
    @Body() dto: ReassignCurativeItemDto,
  ): Promise<{ message: string }> {
    await this.commandBus.execute(
      new ReassignCurativeItemCommand(
        id,
        organizationId,
        dto.assignedTo,
        dto.updatedBy,
      ),
    );
    return { message: 'Curative item reassigned' };
  }

  @Put('curative-items/:id/due-date')
  @ApiOperation({ summary: 'Set curative item due date' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Curative item due date set',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: CURATIVE_ITEM_NOT_FOUND_MESSAGE,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async setCurativeItemDueDate(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
    @Body() dto: SetCurativeItemDueDateDto,
  ): Promise<{ message: string }> {
    await this.commandBus.execute(
      new SetCurativeItemDueDateCommand(
        id,
        organizationId,
        dto.dueDate ? new Date(dto.dueDate) : undefined,
        dto.updatedBy,
      ),
    );
    return { message: 'Curative item due date set' };
  }

  @Put('opinions/:id/status')
  @ApiOperation({ summary: 'Update title opinion status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Title opinion status updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Title opinion not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status or validation error',
  })
  async updateTitleOpinionStatus(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTitleOpinionStatusDto,
  ): Promise<{ message: string }> {
    await this.commandBus.execute(
      new UpdateTitleOpinionStatusCommand(
        id,
        organizationId,
        dto.status as unknown as TitleStatus,
        dto.updatedBy,
      ),
    );
    return { message: 'Title opinion status updated' };
  }

  @Put('opinions/:id/findings')
  @ApiOperation({
    summary: 'Update title opinion findings and recommendations',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Title opinion findings updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Title opinion not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async updateTitleOpinionFindings(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTitleOpinionFindingsDto,
  ): Promise<{ message: string }> {
    await this.commandBus.execute(
      new UpdateTitleOpinionFindingsCommand(
        id,
        organizationId,
        dto.findings,
        dto.recommendations,
      ),
    );
    return { message: 'Title opinion findings updated' };
  }

  @Post('chain-of-title')
  @ApiOperation({ summary: 'Add chain of title entry' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Chain of title entry added',
  })
  async addChainOfTitle(
    @CurrentOrganization() organizationId: string,
    @Body() dto: CreateChainOfTitleEntryDto,
  ): Promise<{ id: string; message: string }> {
    const id: string = await this.commandBus.execute(
      new AddChainOfTitleEntryCommand(
        organizationId,
        dto.leaseId,
        dto.instrumentType,
        new Date(dto.instrumentDate),
        dto.grantor,
        dto.grantee,
        dto.legalDescriptionRef,
        dto.recordingInfo,
        dto.notes,
      ),
    );
    return { id, message: 'Chain of title entry added' };
  }

  @Get('leases/:leaseId/chain-of-title')
  @ApiOperation({ summary: 'List chain of title entries for a lease' })
  @ApiParam({ name: 'leaseId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getChainOfTitle(
    @CurrentOrganization() organizationId: string,
    @Param('leaseId') leaseId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.queryBus.execute(
      new GetChainOfTitleByLeaseQuery(leaseId, organizationId, page, limit),
    );
  }

  @Post('opinions/link-document')
  @ApiOperation({ summary: 'Link a document to a title opinion' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Document linked' })
  async linkDocument(
    @Body() dto: LinkTitleOpinionDocumentDto,
  ): Promise<{ id: string; message: string }> {
    const id: string = await this.commandBus.execute(
      new LinkTitleOpinionDocumentCommand(
        dto.titleOpinionId,
        dto.documentId,
        dto.role,
        dto.pageRange,
        dto.notes,
      ),
    );
    return { id, message: 'Document linked' };
  }

  @Get('curative-items/:id/documents')
  @ApiOperation({ summary: 'Get documents linked to a curative item' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documents retrieved',
    type: [CurativeItemDocumentLinkDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: CURATIVE_ITEM_NOT_FOUND_MESSAGE,
  })
  async getCurativeItemDocuments(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ): Promise<CurativeItemDocumentLinkDto[]> {
    return this.queryBus.execute(
      new GetCurativeItemDocumentsQuery(id, organizationId),
    );
  }

  @Get('opinions/:id/documents')
  @ApiOperation({ summary: 'Get documents linked to a title opinion' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documents retrieved',
    type: [TitleOpinionDocumentLinkDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Title opinion not found',
  })
  async getTitleOpinionDocuments(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ): Promise<TitleOpinionDocumentLinkDto[]> {
    return this.queryBus.execute(
      new GetTitleOpinionDocumentsQuery(id, organizationId),
    );
  }
}
