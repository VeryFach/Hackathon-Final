import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// ── Mock argon2 at the module level ──────────────────────────────────────────
// We replace the real hashing functions with fast, predictable stubs so tests
// run in milliseconds instead of seconds (argon2.hash is intentionally slow).
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('$argon2id$hashed_password'),
  verify: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const argon2 = require('argon2') as {
  hash: jest.Mock;
  verify: jest.Mock;
};

// ── Helper: build a mock PrismaService ───────────────────────────────────────
// Only the methods used by AuthService are mocked.  Using `jest.fn()` lets us
// assert on call counts and arguments later.
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1h',
    };
    return map[key];
  }),
};

// Small factory functions keep test bodies readable and DRY.
const makeRegisterDto = (overrides = {}) => ({
  email: 'alice@example.com',
  password: 'strongP@ss1',
  fullName: 'Alice Wonderland',
  ...overrides,
});

const makeLoginDto = (overrides = {}) => ({
  email: 'alice@example.com',
  password: 'strongP@ss1',
  ...overrides,
});

const makePrismaUser = (overrides = {}) => ({
  id: 'uuid-123',
  email: 'alice@example.com',
  fullName: 'Alice Wonderland',
  passwordHash: '$argon2id$hashed_password',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    // Reset all mock state between tests to prevent leakage.
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        // ── Inject mocks via `useValue` ──────────────────────────────────────
        // NestJS will inject these wherever PrismaService/JwtService/ConfigService
        // are requested in the constructor.
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register()', () => {
    it('should hash the password and create a user, then return a JWT', async () => {
      // Arrange – prisma.user.create resolves with the new user record.
      const user = makePrismaUser();
      mockPrisma.user.create.mockResolvedValue(user);

      // Act
      const result = await service.register(makeRegisterDto());

      // Assert – password was hashed before storing.
      expect(argon2.hash).toHaveBeenCalledWith('strongP@ss1');

      // Assert – prisma received the *hashed* password, never the raw one.
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'alice@example.com',
          fullName: 'Alice Wonderland',
          passwordHash: '$argon2id$hashed_password',
          role: 'masyarakat',
        },
      });

      // Assert – JWT was signed with the correct payload.
      expect(mockJwt.signAsync).toHaveBeenCalledWith(
        { sub: user.id, email: user.email, role: user.role },
        expect.objectContaining({ secret: 'test-secret' }),
      );

      // Assert – the returned object contains the token.
      expect(result).toEqual({ access_token: 'mock.jwt.token' });
    });

    it('should default fullName to "Anonymous User" when not provided', async () => {
      mockPrisma.user.create.mockResolvedValue(
        makePrismaUser({ fullName: 'Anonymous User' }),
      );

      await service.register(makeRegisterDto({ fullName: undefined }));

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ fullName: 'Anonymous User' }),
        }),
      );
    });

    it('should create a pengepul account when role is requested', async () => {
      mockPrisma.user.create.mockResolvedValue(
        makePrismaUser({ role: 'pengepul' }),
      );

      await service.register(makeRegisterDto({ role: 'pengepul' }));

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'pengepul' }),
        }),
      );
    });

    it('should throw ForbiddenException when email is already taken (P2002)', async () => {
      // Simulate Prisma's unique-constraint violation error.
      const prismaError = { code: 'P2002', meta: { target: ['email'] } };
      mockPrisma.user.create.mockRejectedValue(prismaError);

      await expect(service.register(makeRegisterDto())).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.register(makeRegisterDto())).rejects.toThrow(
        'Email already in use',
      );
    });

    it('should re-throw non-P2002 errors without wrapping', async () => {
      const unknownError = new Error('Database unreachable');
      mockPrisma.user.create.mockRejectedValue(unknownError);

      await expect(service.register(makeRegisterDto())).rejects.toThrow(
        'Database unreachable',
      );
    });
  });

  describe('login()', () => {
    it('should return a JWT when credentials are valid', async () => {
      const user = makePrismaUser();
      mockPrisma.user.findUnique.mockResolvedValue(user);
      argon2.verify.mockResolvedValue(true);

      const result = await service.login(makeLoginDto());

      // Verify we looked up the user by email.
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'alice@example.com' },
      });

      // Verify password was checked against the stored hash.
      expect(argon2.verify).toHaveBeenCalledWith(
        user.passwordHash,
        'strongP@ss1',
      );

      expect(result).toEqual({ access_token: 'mock.jwt.token' });
    });

    it('should throw ForbiddenException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(makeLoginDto())).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.login(makeLoginDto())).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw ForbiddenException when password is incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makePrismaUser());
      argon2.verify.mockResolvedValue(false);

      await expect(service.login(makeLoginDto())).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.login(makeLoginDto())).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should include user role in the JWT payload', async () => {
      const adminUser = makePrismaUser({ role: 'admin' });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      argon2.verify.mockResolvedValue(true);

      await service.login(makeLoginDto());

      expect(mockJwt.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin' }),
        expect.any(Object),
      );
    });
  });

  describe('googleLogin()', () => {
    it('should throw ForbiddenException when req.user is missing', async () => {
      await expect(service.googleLogin({})).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.googleLogin({})).rejects.toThrow(
        'No user from google',
      );
    });

    it('should create a new user if Google email is not found, then return JWT', async () => {
      const newUser = makePrismaUser({ email: 'google@example.com' });
      mockPrisma.user.findUnique.mockResolvedValue(null); // user doesn't exist yet
      mockPrisma.user.create.mockResolvedValue(newUser);

      const result = await service.googleLogin({
        user: { email: 'google@example.com', fullName: 'Google User' },
      });

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ access_token: 'mock.jwt.token' });
    });

    it('should skip creation and return JWT if Google user already exists', async () => {
      const existingUser = makePrismaUser({ email: 'google@example.com' });
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const result = await service.googleLogin({
        user: { email: 'google@example.com', name: 'Google User' },
      });

      // Should NOT attempt to create a duplicate user.
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(result).toEqual({ access_token: 'mock.jwt.token' });
    });
  });

  describe('signToken()', () => {
    it('should call jwt.signAsync with correct payload and return access_token', async () => {
      const result = await service.signToken('uuid-1', 'bob@test.com', 'masyarakat' as any);

      expect(mockJwt.signAsync).toHaveBeenCalledWith(
        { sub: 'uuid-1', email: 'bob@test.com', role: 'masyarakat' },
        { expiresIn: '1h', secret: 'test-secret' },
      );
      expect(result).toEqual({ access_token: 'mock.jwt.token' });
    });

    it('should default expiresIn to "1d" when JWT_EXPIRES_IN is not set', async () => {
      mockConfig.get.mockImplementation(((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined; // JWT_EXPIRES_IN not configured
      }) as any);

      await service.signToken('uuid-1', 'bob@test.com', 'masyarakat' as any);

      expect(mockJwt.signAsync).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ expiresIn: '1d' }),
      );
    });
  });
});
