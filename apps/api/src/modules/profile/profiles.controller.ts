import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { ProfilesService } from './profiles.service';
import {
    CreateDepositorProfileDto,
    UpdateDepositorProfileDto,
    CreateCollectorProfileDto,
    UpdateCollectorProfileDto,
} from './dto';

@ApiTags('profiles')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('profiles')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    // ----- DEPOSITOR -----

    @Post('depositor')
    @ApiOperation({ summary: 'Create depositor profile (for masyarakat)' })
    createDepositorProfile(
        @Request() req: any,
        @Body() dto: CreateDepositorProfileDto,
    ) {
        const userId = req.user.sub;
        return this.profilesService.createDepositorProfile(userId, dto);
    }

    @Patch('depositor')
    @ApiOperation({ summary: 'Update depositor profile (location/address)' })
    updateDepositorProfile(
        @Request() req: any,
        @Body() dto: UpdateDepositorProfileDto,
    ) {
        const userId = req.user.sub;
        return this.profilesService.updateDepositorProfile(userId, dto);
    }

    @Get('depositor')
    @ApiOperation({ summary: 'Get depositor profile' })
    getDepositorProfile(@Request() req: any) {
        const userId = req.user.sub;
        return this.profilesService.getDepositorProfile(userId);
    }

    // ----- COLLECTOR -----

    @Post('collector')
    @ApiOperation({ summary: 'Create collector profile (for pengepul)' })
    createCollectorProfile(
        @Request() req: any,
        @Body() dto: CreateCollectorProfileDto,
    ) {
        const userId = req.user.sub;
        return this.profilesService.createCollectorProfile(userId, dto);
    }

    @Patch('collector')
    @ApiOperation({ summary: 'Update collector profile (warehouse, radius, capacity)' })
    updateCollectorProfile(
        @Request() req: any,
        @Body() dto: UpdateCollectorProfileDto,
    ) {
        const userId = req.user.sub;
        return this.profilesService.updateCollectorProfile(userId, dto);
    }

    @Get('collector')
    @ApiOperation({ summary: 'Get collector profile' })
    getCollectorProfile(@Request() req: any) {
        const userId = req.user.sub;
        return this.profilesService.getCollectorProfile(userId);
    }
}