import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { PrismaService } from '../prisma/prisma.service';

// ── Mock helpers ──────────────────────────────────────────────────────────────
const mockPrisma = {
  user: { findUnique: jest.fn() },
  depositorProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  collectorProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

// ── Test data factories ───────────────────────────────────────────────────────
function makeUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    email: 'alice@test.com',
    fullName: 'Alice',
    passwordHash: 'hash',
    role: 'masyarakat',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const depositorDto = {
  latitude: -7.25,
  longitude: 112.75,
  address: 'Jl. Surabaya 1',
};

const collectorDto = {
  latitude: -7.25,
  longitude: 112.75,
  warehouseAddress: 'Gudang A',
  serviceRadiusKm: 10,
  capacityLiter: 5000,
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('ProfilesService', () => {
  let service: ProfilesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.depositorProfile.findUnique.mockReset();
    mockPrisma.depositorProfile.create.mockReset();
    mockPrisma.depositorProfile.update.mockReset();
    mockPrisma.collectorProfile.findUnique.mockReset();
    mockPrisma.collectorProfile.create.mockReset();
    mockPrisma.collectorProfile.update.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // DEPOSITOR
  // ─────────────────────────────────────────────────────────────────────────────
  describe('createDepositorProfile()', () => {
    it('should create a depositor profile for a masyarakat user', async () => {
      const user = makeUser({ role: 'masyarakat', depositorProfile: null });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.depositorProfile.create.mockResolvedValue({
        id: 'dp-1',
        userId: 'user-1',
        ...depositorDto,
      });

      const result = await service.createDepositorProfile('user-1', depositorDto as any);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { depositorProfile: true },
      });
      expect(mockPrisma.depositorProfile.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', ...depositorDto },
      });
      expect(result).toEqual({ id: 'dp-1', userId: 'user-1', ...depositorDto });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.createDepositorProfile('no-user', depositorDto as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not masyarakat', async () => {
      const user = makeUser({ role: 'pengepul', depositorProfile: null });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      await expect(service.createDepositorProfile('user-1', depositorDto as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if depositor profile already exists', async () => {
      const user = makeUser({ role: 'masyarakat', depositorProfile: { id: 'dp-1' } });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      await expect(service.createDepositorProfile('user-1', depositorDto as any))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('updateDepositorProfile()', () => {
    it('should update an existing depositor profile', async () => {
      mockPrisma.depositorProfile.findUnique.mockResolvedValue({ id: 'dp-1', userId: 'user-1' });
      mockPrisma.depositorProfile.update.mockResolvedValue({
        id: 'dp-1',
        userId: 'user-1',
        ...depositorDto,
      });

      const result = await service.updateDepositorProfile('user-1', depositorDto as any);
      expect(result.userId).toBe('user-1');
    });

    it('should throw NotFoundException if depositor profile not found', async () => {
      mockPrisma.depositorProfile.findUnique.mockResolvedValue(null);
      await expect(service.updateDepositorProfile('user-1', depositorDto as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getDepositorProfile()', () => {
    it('should return the depositor profile with user info', async () => {
      const profile = { id: 'dp-1', userId: 'user-1', user: { id: 'user-1', email: 'alice@test.com' } };
      mockPrisma.depositorProfile.findUnique.mockResolvedValue(profile);
      const result = await service.getDepositorProfile('user-1');
      expect(result).toEqual(profile);
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockPrisma.depositorProfile.findUnique.mockResolvedValue(null);
      await expect(service.getDepositorProfile('user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // COLLECTOR
  // ─────────────────────────────────────────────────────────────────────────────
  describe('createCollectorProfile()', () => {
    it('should create a collector profile for a pengepul user', async () => {
      const user = makeUser({ role: 'pengepul', collectorProfile: null });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.collectorProfile.create.mockResolvedValue({
        id: 'cp-1',
        userId: 'user-1',
        ...collectorDto,
      });

      const result = await service.createCollectorProfile('user-1', collectorDto as any);
      expect(result).toEqual({ id: 'cp-1', userId: 'user-1', ...collectorDto });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.createCollectorProfile('no-user', collectorDto as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not pengepul', async () => {
      const user = makeUser({ role: 'masyarakat', collectorProfile: null });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      await expect(service.createCollectorProfile('user-1', collectorDto as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if collector profile already exists', async () => {
      const user = makeUser({ role: 'pengepul', collectorProfile: { id: 'cp-1' } });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      await expect(service.createCollectorProfile('user-1', collectorDto as any))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('updateCollectorProfile()', () => {
    it('should update an existing collector profile', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue({ id: 'cp-1', userId: 'user-1' });
      mockPrisma.collectorProfile.update.mockResolvedValue({
        id: 'cp-1',
        userId: 'user-1',
        ...collectorDto,
      });

      const result = await service.updateCollectorProfile('user-1', collectorDto as any);
      expect(result.userId).toBe('user-1');
    });

    it('should throw NotFoundException if collector profile not found', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(null);
      await expect(service.updateCollectorProfile('user-1', collectorDto as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getCollectorProfile()', () => {
    it('should return the collector profile with user info', async () => {
      const profile = { id: 'cp-1', userId: 'user-1', user: { id: 'user-1', email: 'bob@test.com' } };
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(profile);
      const result = await service.getCollectorProfile('user-1');
      expect(result).toEqual(profile);
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(null);
      await expect(service.getCollectorProfile('user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
