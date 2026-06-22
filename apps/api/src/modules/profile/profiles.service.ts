import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import {
    CreateDepositorProfileDto,
    UpdateDepositorProfileDto,
    CreateCollectorProfileDto,
    UpdateCollectorProfileDto,
} from './dto';

@Injectable()
export class ProfilesService {
    constructor(private prisma: PrismaService) { }

    // ==================== DEPOSITOR ====================

    async createDepositorProfile(
        userId: string,
        dto: CreateDepositorProfileDto,
    ) {
        // Cek user dan role
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { depositorProfile: true },
        });
        if (!user) throw new NotFoundException('User not found');
        if (user.role !== UserRole.masyarakat) {
            throw new ForbiddenException('Only masyarakat can create depositor profile');
        }
        if (user.depositorProfile) {
            throw new ConflictException('Depositor profile already exists for this user');
        }

        // Buat profil
        return this.prisma.depositorProfile.create({
            data: {
                userId: user.id,
                latitude: dto.latitude,
                longitude: dto.longitude,
                address: dto.address,
            },
        });
    }

    async updateDepositorProfile(
        userId: string,
        dto: UpdateDepositorProfileDto,
    ) {
        // Cek apakah profil ada
        const profile = await this.prisma.depositorProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new NotFoundException('Depositor profile not found for this user');
        }

        // Update
        return this.prisma.depositorProfile.update({
            where: { userId },
            data: {
                latitude: dto.latitude,
                longitude: dto.longitude,
                address: dto.address,
            },
        });
    }

    async getDepositorProfile(userId: string) {
        const profile = await this.prisma.depositorProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        role: true,
                    },
                },
            },
        });
        if (!profile) throw new NotFoundException('Depositor profile not found');
        return profile;
    }

    // ==================== COLLECTOR ====================

    async createCollectorProfile(
        userId: string,
        dto: CreateCollectorProfileDto,
    ) {
        // Cek user dan role
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { collectorProfile: true },
        });
        if (!user) throw new NotFoundException('User not found');
        if (user.role !== UserRole.pengepul) {
            throw new ForbiddenException('Only pengepul can create collector profile');
        }
        if (user.collectorProfile) {
            throw new ConflictException('Collector profile already exists for this user');
        }

        // Buat profil
        return this.prisma.collectorProfile.create({
            data: {
                userId: user.id,
                latitude: dto.latitude,
                longitude: dto.longitude,
                warehouseAddress: dto.warehouseAddress,
                serviceRadiusKm: dto.serviceRadiusKm,
                capacityLiter: dto.capacityLiter,
            },
        });
    }

    async updateCollectorProfile(
        userId: string,
        dto: UpdateCollectorProfileDto,
    ) {
        // Cek apakah profil ada
        const profile = await this.prisma.collectorProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new NotFoundException('Collector profile not found for this user');
        }

        // Update
        return this.prisma.collectorProfile.update({
            where: { userId },
            data: {
                latitude: dto.latitude,
                longitude: dto.longitude,
                warehouseAddress: dto.warehouseAddress,
                serviceRadiusKm: dto.serviceRadiusKm,
                capacityLiter: dto.capacityLiter,
            },
        });
    }

    async getCollectorProfile(userId: string) {
        const profile = await this.prisma.collectorProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        role: true,
                    },
                },
            },
        });
        if (!profile) throw new NotFoundException('Collector profile not found');
        return profile;
    }
}