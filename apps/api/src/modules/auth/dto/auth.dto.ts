import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
} from 'class-validator';
import { IRegisterDto, ILoginDto } from '@repo/dto';
import { UserRole } from '@prisma/client';

export class RegisterDto implements IRegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiProperty({
    enum: UserRole,
    required: false,
    default: UserRole.masyarakat,
    description: 'Default: masyarakat'
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(UserRole))
  role?: UserRole;
}

export class LoginDto implements ILoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}