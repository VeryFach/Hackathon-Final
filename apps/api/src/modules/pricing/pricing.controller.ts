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
import { PricingService } from './pricing.service.js';
import { JwtGuard } from '../auth/guard/jwt.guard.js';
import { RolesGuard } from '../auth/guard/roles.guard.js';
import { Roles } from '../auth/decorator/roles.decorator.js';
import { GetUser } from '../auth/decorator/get-user.decorator.js';
import { ZodValidationPipe } from '../../lib/pipes/zod.pipe.js';
import {
  CreatePricingSchema,
  CreateGradeRuleSchema,
  CreateVolumeRuleSchema,
} from '@repo/dto';
import type {
  ICreatePricingDto,
  ICreateGradeRuleDto,
  ICreateVolumeRuleDto,
} from '@repo/dto';

@ApiTags('pricing')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post()
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Create a new pricing configuration' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Pricing June 2026', description: 'Optional pricing config label' },
        basePrice: { type: 'number', example: 8000, description: 'Optional base price reference' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Pricing configuration created (inactive by default)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires stakeholder role' })
  create(
    @GetUser('id') userId: string,
    @Body(new ZodValidationPipe(CreatePricingSchema)) dto: ICreatePricingDto,
  ) {
    return this.pricingService.create(userId, dto);
  }

  @Post(':id/grade-rules')
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Add a grade pricing rule' })
  @ApiParam({ name: 'id', description: 'Pricing config ID', example: 'pricing-uuid-here' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['grade', 'multiplier'],
      properties: {
        grade: { type: 'string', example: 'A', description: 'Oil grade (A, B, C)' },
        multiplier: { type: 'number', example: 1.2, description: 'Quality factor multiplier' },
        basePrice: { type: 'number', example: 8000, description: 'Base price for this grade' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Grade rule created' })
  @ApiResponse({ status: 400, description: 'Duplicate grade or invalid pricing' })
  @ApiResponse({ status: 404, description: 'Pricing configuration not found' })
  addGradeRule(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateGradeRuleSchema)) dto: ICreateGradeRuleDto,
  ) {
    return this.pricingService.addGradeRule(id, dto);
  }

  @Post(':id/volume-rules')
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Add a volume pricing rule' })
  @ApiParam({ name: 'id', description: 'Pricing config ID', example: 'pricing-uuid-here' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['minVolume', 'percentage'],
      properties: {
        minVolume: { type: 'number', example: 0, description: 'Minimum volume in liters' },
        maxVolume: { type: 'number', example: 100, description: 'Maximum volume in liters (null for open-ended)', nullable: true },
        percentage: { type: 'number', example: 0, description: 'Bonus/discount factor (0 = 0%, 0.05 = 5%)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Volume rule created' })
  @ApiResponse({ status: 400, description: 'Overlapping range or invalid pricing' })
  @ApiResponse({ status: 404, description: 'Pricing configuration not found' })
  addVolumeRule(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateVolumeRuleSchema)) dto: ICreateVolumeRuleDto,
  ) {
    return this.pricingService.addVolumeRule(id, dto);
  }

  @Patch(':id/activate')
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Activate pricing configuration (deactivates all others)' })
  @ApiParam({ name: 'id', description: 'Pricing config ID', example: 'pricing-uuid-here' })
  @ApiResponse({ status: 200, description: 'Pricing configuration activated' })
  @ApiResponse({ status: 404, description: 'Pricing configuration not found' })
  activate(@Param('id') id: string) {
    return this.pricingService.activate(id);
  }

  @Post('calculate/:batchId')
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Calculate final batch price' })
  @ApiParam({ name: 'batchId', description: 'Batch ID', example: 'batch-uuid-here' })
  @ApiResponse({ status: 201, description: 'Batch pricing calculated and saved' })
  @ApiResponse({ status: 400, description: 'Invalid batch state, no active pricing, or duplicate calculation' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  calculate(@Param('batchId') batchId: string) {
    return this.pricingService.calculate(batchId);
  }

  @Get()
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Get all pricing configurations' })
  @ApiResponse({ status: 200, description: 'All pricing configurations returned' })
  findAll() {
    return this.pricingService.findAll();
  }

  @Get(':id')
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Get pricing configuration detail' })
  @ApiParam({ name: 'id', description: 'Pricing config ID', example: 'pricing-uuid-here' })
  @ApiResponse({ status: 200, description: 'Pricing configuration detail returned' })
  @ApiResponse({ status: 404, description: 'Pricing configuration not found' })
  findOne(@Param('id') id: string) {
    return this.pricingService.findOne(id);
  }
}
