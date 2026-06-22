import {
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
  ApiParam,
} from '@nestjs/swagger';
import { PayoutsService } from './payouts.service.js';
import { JwtGuard } from '../auth/guard/jwt.guard.js';
import { RolesGuard } from '../auth/guard/roles.guard.js';
import { Roles } from '../auth/decorator/roles.decorator.js';
import { GetUser } from '../auth/decorator/get-user.decorator.js';

@ApiTags('payouts')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post(':submissionId')
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Create payout for a submission' })
  @ApiParam({ name: 'submissionId', description: 'Submission ID', example: 'submission-uuid-here' })
  @ApiResponse({ status: 201, description: 'Payout created with calculated amount' })
  @ApiResponse({ status: 400, description: 'Invalid submission state, missing actual liter, or duplicate payout' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  create(@Param('submissionId') submissionId: string) {
    return this.payoutsService.create(submissionId);
  }

  @Patch(':id/pay')
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Mark payout as paid' })
  @ApiParam({ name: 'id', description: 'Payout ID', example: 'payout-uuid-here' })
  @ApiResponse({ status: 200, description: 'Payout marked as paid' })
  @ApiResponse({ status: 400, description: 'Payout already paid' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  pay(@Param('id') id: string) {
    return this.payoutsService.pay(id);
  }

  @Get('me')
  @Roles('masyarakat')
  @ApiOperation({ summary: 'Get own payout history (depositor)' })
  @ApiResponse({ status: 200, description: 'Payout history for authenticated depositor' })
  @ApiResponse({ status: 404, description: 'Depositor profile not found' })
  findMine(@GetUser('id') userId: string) {
    return this.payoutsService.findMine(userId);
  }

  @Get()
  @Roles('stakeholder')
  @ApiOperation({ summary: 'Get all payouts (stakeholder)' })
  @ApiResponse({ status: 200, description: 'All payouts returned' })
  findAll() {
    return this.payoutsService.findAll();
  }
}
