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
import { SubmissionsService } from './submissions.service.js';
import { JwtGuard } from '../auth/guard/jwt.guard.js';
import { RolesGuard } from '../auth/guard/roles.guard.js';
import { Roles } from '../auth/decorator/roles.decorator.js';
import { GetUser } from '../auth/decorator/get-user.decorator.js';
import { ZodValidationPipe } from '../../lib/pipes/zod.pipe.js';
import {
  CreateSubmissionSchema,
  MarkInBatchSchema,
  RecordActualLiterSchema,
} from '@repo/dto';
import { UserRole } from '@prisma/client';
import type {
  ICreateSubmissionDto,
  IMarkInBatchDto,
  IRecordActualLiterDto,
} from '@repo/dto';

@ApiTags('submissions')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @Roles(UserRole.masyarakat)
  @ApiOperation({ summary: 'Create a new oil submission' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['estimatedLiter'],
      properties: {
        estimatedLiter: { type: 'number', example: 15.5, description: 'Estimated volume in liters' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Submission created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires masyarakat role' })
  create(
    @GetUser('id') userId: string,
    @Body(new ZodValidationPipe(CreateSubmissionSchema)) dto: ICreateSubmissionDto,
  ) {
    return this.submissionsService.create(userId, dto);
  }

  @Get('me')
  @Roles(UserRole.masyarakat)
  @ApiOperation({ summary: 'Get all submissions for the current user' })
  @ApiResponse({ status: 200, description: 'Returns user submissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findMine(@GetUser('id') userId: string) {
    return this.submissionsService.findMine(userId);
  }

  @Get('pending')
  @Roles(UserRole.pengepul)
  @ApiOperation({ summary: 'Get pending submissions available for collectors' })
  @ApiResponse({ status: 200, description: 'Returns pending submissions' })
  findPending() {
    return this.submissionsService.findPending();
  }

  @Get('collector')
  @Roles(UserRole.pengepul)
  @ApiOperation({ summary: 'Get submissions assigned to the current collector' })
  @ApiResponse({ status: 200, description: 'Returns collector submissions' })
  findForCollector(@GetUser('id') userId: string) {
    return this.submissionsService.findForCollector(userId);
  }

  @Get(':id')
  @Roles(UserRole.masyarakat)
  @ApiOperation({ summary: 'Get submission by ID' })
  @ApiParam({ name: 'id', description: 'Submission ID', example: 'sub-uuid-here' })
  @ApiResponse({ status: 200, description: 'Returns submission details' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  @ApiResponse({ status: 403, description: 'Not authorized to view this submission' })
  findOne(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.submissionsService.findOne(id, userId);
  }

  @Patch(':id/accept')
  @Roles(UserRole.pengepul)
  @ApiOperation({ summary: 'Accept a pending submission' })
  @ApiResponse({ status: 200, description: 'Submission accepted' })
  @ApiResponse({ status: 400, description: 'Invalid submission status' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  accept(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.submissionsService.accept(id, userId);
  }

  @Patch(':id/pickup')
  @Roles(UserRole.pengepul)
  @ApiOperation({ summary: 'Mark submission as picked up' })
  @ApiResponse({ status: 200, description: 'Submission picked up' })
  @ApiResponse({ status: 400, description: 'Invalid submission status' })
  @ApiResponse({ status: 403, description: 'Not the assigned collector' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  pickup(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.submissionsService.pickup(id, userId);
  }

  @Patch(':id/actual-liter')
  @Roles(UserRole.pengepul)
  @ApiOperation({ summary: 'Record measured actual liter after pickup' })
  @ApiParam({ name: 'id', description: 'Submission ID', example: 'sub-uuid-here' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['actualLiter'],
      properties: {
        actualLiter: { type: 'number', example: 14.8, description: 'Measured volume in liters' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Actual liter recorded' })
  @ApiResponse({ status: 400, description: 'Invalid submission status or amount' })
  @ApiResponse({ status: 403, description: 'Not the assigned collector' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  recordActualLiter(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body(new ZodValidationPipe(RecordActualLiterSchema)) dto: IRecordActualLiterDto,
  ) {
    return this.submissionsService.recordActualLiter(id, userId, dto);
  }

  @Patch(':id/in-batch')
  @Roles(UserRole.pengepul)
  @ApiOperation({ summary: 'Assign submission to a batch' })
  @ApiParam({ name: 'id', description: 'Submission ID', example: 'sub-uuid-here' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['batchId'],
      properties: {
        batchId: { type: 'string', example: 'batch-uuid-here', description: 'Target batch ID' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Submission assigned to batch' })
  @ApiResponse({ status: 400, description: 'Invalid submission status' })
  @ApiResponse({ status: 403, description: 'Not the assigned collector' })
  @ApiResponse({ status: 404, description: 'Submission or batch not found' })
  markInBatch(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body(new ZodValidationPipe(MarkInBatchSchema)) dto: IMarkInBatchDto,
  ) {
    return this.submissionsService.markInBatch(id, userId, dto);
  }
}
