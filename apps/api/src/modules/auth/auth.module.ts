import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategy/jwt.strategy.js';
import { GoogleStrategy } from './strategy/google.strategy.js';
import { JwtGuard } from './guard/jwt.guard.js';
import { RolesGuard } from './guard/roles.guard.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, JwtGuard, RolesGuard],
  exports: [AuthService, JwtGuard, RolesGuard, PassportModule],
})
export class AuthModule { }
