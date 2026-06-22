import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service.js';
import { JwtGuard } from '../auth/guard/jwt.guard.js';
import { RolesGuard } from '../auth/guard/roles.guard.js';
import { Roles } from '../auth/decorator/roles.decorator.js';
import { GetUser } from '../auth/decorator/get-user.decorator.js';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('stakeholder')
    @Roles('stakeholder')
    getStakeholderDashboard() {
        return this.analyticsService.getStakeholderDashboard();
    }

    @Get('collector')
    @Roles('pengepul')
    getCollectorDashboard(@GetUser('id') userId: string) {
        return this.analyticsService.getCollectorDashboard(userId);
    }

    @Get('depositor')
    @Roles('masyarakat')
    getDepositorDashboard(@GetUser('id') userId: string) {
        return this.analyticsService.getDepositorDashboard(userId);
    }
}