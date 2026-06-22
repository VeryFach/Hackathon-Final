import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './modules/users/users.module.js';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProfilesModule } from './modules/profile/profiles.module.js';
import { SubmissionsModule } from './modules/submissions/submissions.module.js';
import { BatchesModule } from './modules/batches/batches.module.js';
import { LabModule } from './modules/lab/lab.module.js';
import { PricingModule } from './modules/pricing/pricing.module.js';
import { PayoutsModule } from './modules/payouts/payouts.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js'
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './modules/auth/guard/jwt.guard.js';
import { RolesGuard } from './modules/auth/guard/roles.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    SubmissionsModule,
    BatchesModule,
    LabModule,
    PricingModule,
    PayoutsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
