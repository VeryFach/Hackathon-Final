import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  MinLength,
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
    enum: [UserRole.masyarakat, UserRole.pengepul],
    required: false,
    default: UserRole.masyarakat,
    description: 'Public registration supports masyarakat or pengepul only',
  })
  @IsOptional()
  @IsString()
  @IsIn([UserRole.masyarakat, UserRole.pengepul])
  role?: 'masyarakat' | 'pengepul';
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
