import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { BatchesService } from './batches.service.js';
import { JwtGuard } from '../auth/guard/jwt.guard.js';
import { RolesGuard } from '../auth/guard/roles.guard.js';
import { Roles } from '../auth/decorator/roles.decorator.js';
import { GetUser } from '../auth/decorator/get-user.decorator.js';
import { ZodValidationPipe } from '../../lib/pipes/zod.pipe.js';
import {
  CreateBatchSchema,
  AddBatchItemsSchema,
  ProcessBatchSchema,
} from '@repo/dto';
import { UserRole } from '@prisma/client';
import type {
  ICreateBatchDto,
  IAddBatchItemsDto,
  IProcessBatchDto,
} from '@repo/dto';

@ApiTags('batches')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @Roles(UserRole.pengepul)
  @ApiOperation({ summary: 'Create a new empty batch' })
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires pengepul role' })
  create(
    @GetUser('id') userId: string,
    @Body(new ZodValidationPipe(CreateBatchSchema)) dto: ICreateBatchDto,
  ) {
    return this.batchesService.create(userId, dto);
  }

  @Get('me')
  @Roles(UserRole.pengepul)
  @ApiOperation({ summary: 'Get batches owned by current collector' })
  @ApiResponse({ status: 200, description: 'Collector batches returned' })
  findMine(@GetUser('id') userId: string) {
    return this.batchesService.findMine(userId);
  }

  @Get()
  @Roles(UserRole.stakeholder)
  @ApiOperation({ summary: 'Get all batches for stakeholder review' })
  @ApiResponse({ status: 200, description: 'All batches returned' })
  findAllForStakeholder() {
    return this.batchesService.findAllForStakeholder();
  }

  @Post(':id/items')
  @Roles(UserRole.pengepul)
  @ApiOperation({ summary: 'Add submissions into batch' })
  @ApiParam({ name: 'id', description: 'Batch ID', example: 'batch-uuid-here' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['submissionIds'],
      properties: {
        submissionIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['sub-uuid-1', 'sub-uuid-2', 'sub-uuid-3'],
          description: 'Array of submission IDs to add',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Items added to batch' })
  @ApiResponse({ status: 400, description: 'Invalid submission or batch status' })
  @ApiResponse({ status: 403, description: 'Batch or submission not owned by collector' })
  @ApiResponse({ status: 404, description: 'Batch or submission not found' })
  addItems(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body(new ZodValidationPipe(AddBatchItemsSchema)) dto: IAddBatchItemsDto,
  ) {
    return this.batchesService.addItems(id, userId, dto);
  }

  @Patch(':id/process')
  @Roles(UserRole.pengepul)
  @ApiOperation({ summary: 'Process batch calculations' })
  @ApiParam({ name: 'id', description: 'Batch ID', example: 'batch-uuid-here' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['rawOil', 'residue'],
      properties: {
        rawOil: { type: 'number', example: 120, description: 'Total raw oil in liters' },
        residue: { type: 'number', example: 20, description: 'Residue in liters' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Batch processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid raw oil or residue values' })
  @ApiResponse({ status: 403, description: 'Batch not owned by collector' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  process(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body(new ZodValidationPipe(ProcessBatchSchema)) dto: IProcessBatchDto,
  ) {
    return this.batchesService.process(id, userId, dto);
  }

  @Patch(':id/send')
  @Roles(UserRole.pengepul)
  @ApiOperation({ summary: 'Mark batch as sent to refinery' })
  @ApiParam({ name: 'id', description: 'Batch ID', example: 'batch-uuid-here' })
  @ApiResponse({ status: 200, description: 'Batch marked as sent' })
  @ApiResponse({ status: 400, description: 'Batch not yet processed' })
  @ApiResponse({ status: 403, description: 'Batch not owned by collector' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  send(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.batchesService.send(id, userId);
  }

  @Get(':id')
  @Roles(UserRole.pengepul, UserRole.stakeholder)
  @ApiOperation({ summary: 'Get full batch detail' })
  @ApiParam({ name: 'id', description: 'Batch ID', example: 'batch-uuid-here' })
  @ApiResponse({ status: 200, description: 'Batch detail returned' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  findOne(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.batchesService.findOne(id, userId, role);
  }
}
