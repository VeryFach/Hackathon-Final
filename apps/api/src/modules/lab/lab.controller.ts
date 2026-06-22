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
import { LabService } from './lab.service.js';
import { JwtGuard } from '../auth/guard/jwt.guard.js';
import { RolesGuard } from '../auth/guard/roles.guard.js';
import { Roles } from '../auth/decorator/roles.decorator.js';
import { GetUser } from '../auth/decorator/get-user.decorator.js';
import { ZodValidationPipe } from '../../lib/pipes/zod.pipe.js';
import { CreateLabResultSchema, RejectLabSchema } from '@repo/dto';
import type { ICreateLabResultDto, IRejectLabDto } from '@repo/dto';
import { UserRole } from '@prisma/client';

@ApiTags('lab')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Post(':batchId')
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Create lab inspection result for batch' })
  @ApiParam({ name: 'batchId', description: 'Batch ID', example: 'batch-uuid-here' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ffa', 'water', 'impurity'],
      properties: {
        ffa: { type: 'number', example: 1.8, description: 'Free Fatty Acid level' },
        water: { type: 'number', example: 0.2, description: 'Water content' },
        impurity: { type: 'number', example: 0.1, description: 'Impurity level' },
        notes: { type: 'string', example: 'Good quality oil', description: 'Optional inspection notes' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Lab result created with auto-calculated grade' })
  @ApiResponse({ status: 400, description: 'Invalid batch status, duplicate result, or values exceed grade thresholds' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  create(
    @Param('batchId') batchId: string,
    @Body(new ZodValidationPipe(CreateLabResultSchema)) dto: ICreateLabResultDto,
  ) {
    return this.labService.create(batchId, dto);
  }

  @Get(':batchId')
  @Roles('pengepul', 'stakeholder')
  @ApiOperation({ summary: 'Get lab result for specific batch' })
  @ApiParam({ name: 'batchId', description: 'Batch ID', example: 'batch-uuid-here' })
  @ApiResponse({ status: 200, description: 'Lab result returned with batch info' })
  @ApiResponse({ status: 404, description: 'Batch or lab result not found' })
  findByBatch(
    @Param('batchId') batchId: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.labService.findByBatch(batchId, userId, role);
  }

  @Patch(':batchId/approve')
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Approve batch after lab inspection' })
  @ApiParam({ name: 'batchId', description: 'Batch ID', example: 'batch-uuid-here' })
  @ApiResponse({ status: 200, description: 'Batch approved successfully' })
  @ApiResponse({ status: 400, description: 'No lab result or already finalized' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  approve(
    @Param('batchId') batchId: string,
    @GetUser('id') userId: string,
  ) {
    return this.labService.approve(batchId, userId);
  }

  @Patch(':batchId/reject')
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Reject batch after lab inspection' })
  @ApiParam({ name: 'batchId', description: 'Batch ID', example: 'batch-uuid-here' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['reason'],
      properties: {
        reason: { type: 'string', example: 'FFA too high', description: 'Rejection reason' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Batch rejected' })
  @ApiResponse({ status: 400, description: 'No lab result or already finalized' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  reject(
    @Param('batchId') batchId: string,
    @GetUser('id') userId: string,
    @Body(new ZodValidationPipe(RejectLabSchema)) dto: IRejectLabDto,
  ) {
    return this.labService.reject(batchId, userId, dto);
  }
}
