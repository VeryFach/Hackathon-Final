import { ApiProperty } from '@nestjs/swagger';
import { IEditUserDto } from '@repo/dto';
import { UserRole } from '@prisma/client';

export class EditUserDto implements IEditUserDto {
  @ApiProperty({ example: 'newemail@example.com', required: false })
  email?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;

  @ApiProperty({ example: 'masyarakat', enum: UserRole, required: false })
  role?: 'stakeholder' | 'masyarakat' | 'pengepul';
}