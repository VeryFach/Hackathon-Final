import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator @Roles()
 * @param roles Array role yang diizinkan
 * @returns Decorator function yang mengatur metadata di controller/handler
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
