import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  UsePipes
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { JwtGuard } from '../auth/guard/jwt.guard.js';
import { GetUser } from '../auth/decorator/get-user.decorator.js';
import { EditUserDto } from './dto/edit-user.dto.js';
import { ZodValidationPipe } from 'src/lib/pipes/zod.pipe';
import { EditUserSchema } from '@repo/dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns the current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@GetUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: EditUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  editUser(
    @GetUser('id') userId: string,
    @Body(new ZodValidationPipe(EditUserSchema)) dto: EditUserDto
  ) {
    return this.usersService.editUser(userId, dto);
  }
}