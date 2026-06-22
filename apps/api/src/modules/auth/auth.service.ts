import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await argon2.hash(dto.password);
    try {
      const fullName = dto.fullName || 'Anonymous User';
      const role = dto.role ?? UserRole.masyarakat;
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          fullName,
          passwordHash,
          role,
        },
      });

      return this.signToken(user);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException('Email already in use');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');
    return this.signToken(user);
  }

  async googleLogin(req: any) {
    if (!req.user) {
      throw new ForbiddenException('No user from google');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: req.user.email },
    });

    if (!user) {
      const dummyHash = await argon2.hash(
        Math.random().toString(36).substring(7),
      );
      user = await this.prisma.user.create({
        data: {
          email: req.user.email,
          fullName: req.user.fullName || req.user.name || 'Google User',
          passwordHash: dummyHash,
          role: UserRole.masyarakat, // default untuk google login
        },
      });
    }

    return this.signToken(user);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, fullName: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async signToken(
    userOrId:
      | {
          id: string;
          email: string;
          role: UserRole;
          fullName: string;
        }
      | string,
    email?: string,
    role?: UserRole,
    fullName = '',
  ): Promise<{
    access_token: string;
    user: { id: string; email: string; role: UserRole; fullName: string };
  }> {
    const user =
      typeof userOrId === 'string'
        ? {
            id: userOrId,
            email: email ?? '',
            role: role ?? UserRole.masyarakat,
            fullName,
          }
        : userOrId;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
    const secret = this.config.get<string>('JWT_SECRET');
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') || '1d';
    const token = await this.jwt.signAsync(payload, {
      expiresIn: expiresIn as any,
      secret,
    });
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }
}
