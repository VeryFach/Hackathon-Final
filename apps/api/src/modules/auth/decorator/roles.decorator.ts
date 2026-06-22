import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator @Roles()
 * @param roles Array of string yang berisi role yang diizinkan (contoh: 'citizen', 'admin')
 * @returns Decorator function yang mengatur metadata di controller/handler
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
