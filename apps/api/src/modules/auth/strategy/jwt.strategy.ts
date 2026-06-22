import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: (req: Request) => {
        // 1. Coba ambil token dari cookie
        const cookieToken = req?.cookies?.['cookie_token'];
        if (cookieToken) return cookieToken;

        // 2. Fallback ke Authorization: Bearer header
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return null;
    }

    // Return the JWT payload so req.user contains { sub, email, role }
    // Include `id` as alias for `sub` for compatibility with @GetUser('id')
    // The DB lookup above ensures the user still exists
    return { sub: payload.sub, id: payload.sub, email: payload.email, role: payload.role };
  }
}
