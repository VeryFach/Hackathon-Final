import {
  Injectable,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator.js';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context?: ExecutionContext) {
    if (err || !user) {
      const request = context?.switchToHttp().getRequest();
      this.logger.warn(
        JSON.stringify({
          message: 'JWT authentication failed',
          path: request?.originalUrl ?? request?.url,
          method: request?.method,
          hasAuthorizationHeader: Boolean(request?.headers?.authorization),
          hasCookieToken: Boolean(request?.cookies?.cookie_token),
          reason: err?.message ?? info?.message ?? 'Unauthorized',
          reasonName: err?.name ?? info?.name,
        }),
      );

      throw err || new UnauthorizedException(info?.message ?? 'Unauthorized');
    }
    return user;
  }
}
