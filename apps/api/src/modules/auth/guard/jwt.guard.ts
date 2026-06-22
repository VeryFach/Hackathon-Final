import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  // Optionally override canActivate for custom logic
  // canActivate(context: ExecutionContext) {
  //   return super.canActivate(context);
  // }

  // Optionally override handleRequest for custom error handling
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new Error('Unauthorized');
    }
    return user;
  }
}