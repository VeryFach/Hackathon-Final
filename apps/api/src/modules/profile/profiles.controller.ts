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
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { ProfilesService } from './profiles.service';
import {
    CreateDepositorProfileDto,
    UpdateDepositorProfileDto,
    CreateCollectorProfileDto,
    UpdateCollectorProfileDto,
} from './dto';
import { ZodValidationPipe } from '../../lib/pipes/zod.pipe';
import {
    CreateCollectorProfileSchema,
    CreateDepositorProfileSchema,
    UpdateCollectorProfileSchema,
    UpdateDepositorProfileSchema,
} from '@repo/dto';
import { UserRole } from '@prisma/client';

@ApiTags('profiles')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('profiles')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    // ----- DEPOSITOR -----

    @Post('depositor')
    @Roles(UserRole.masyarakat)
    @ApiOperation({ summary: 'Create depositor profile (for masyarakat)' })
    createDepositorProfile(
        @Request() req: any,
        @Body(new ZodValidationPipe(CreateDepositorProfileSchema)) dto: CreateDepositorProfileDto,
    ) {
        const userId = req.user.sub;
        return this.profilesService.createDepositorProfile(userId, dto);
    }

    @Patch('depositor')
    @Roles(UserRole.masyarakat)
    @ApiOperation({ summary: 'Update depositor profile (location/address)' })
    updateDepositorProfile(
        @Request() req: any,
        @Body(new ZodValidationPipe(UpdateDepositorProfileSchema)) dto: UpdateDepositorProfileDto,
    ) {
        const userId = req.user.sub;
        return this.profilesService.updateDepositorProfile(userId, dto);
    }

    @Get('depositor')
    @Roles(UserRole.masyarakat)
    @ApiOperation({ summary: 'Get depositor profile' })
    getDepositorProfile(@Request() req: any) {
        const userId = req.user.sub;
        return this.profilesService.getDepositorProfile(userId);
    }

    // ----- COLLECTOR -----

    @Post('collector')
    @Roles(UserRole.pengepul)
    @ApiOperation({ summary: 'Create collector profile (for pengepul)' })
    createCollectorProfile(
        @Request() req: any,
        @Body(new ZodValidationPipe(CreateCollectorProfileSchema)) dto: CreateCollectorProfileDto,
    ) {
        const userId = req.user.sub;
        return this.profilesService.createCollectorProfile(userId, dto);
    }

    @Patch('collector')
    @Roles(UserRole.pengepul)
    @ApiOperation({ summary: 'Update collector profile (warehouse, radius, capacity)' })
    updateCollectorProfile(
        @Request() req: any,
        @Body(new ZodValidationPipe(UpdateCollectorProfileSchema)) dto: UpdateCollectorProfileDto,
    ) {
        const userId = req.user.sub;
        return this.profilesService.updateCollectorProfile(userId, dto);
    }

    @Get('collector')
    @Roles(UserRole.pengepul)
    @ApiOperation({ summary: 'Get collector profile' })
    getCollectorProfile(@Request() req: any) {
        const userId = req.user.sub;
        return this.profilesService.getCollectorProfile(userId);
    }
}
