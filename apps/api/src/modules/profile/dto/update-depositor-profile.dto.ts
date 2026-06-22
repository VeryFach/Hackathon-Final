import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Matches } from 'class-validator';
import { IUpdateDepositorProfileDto } from '@repo/dto';

export class UpdateDepositorProfileDto implements IUpdateDepositorProfileDto {
    @ApiProperty({ example: '-6.2088', required: false })
    @IsOptional()
    @IsString()
    @Matches(/^-?\d+(\.\d+)?$/, { message: 'Must be a valid decimal number' })
    latitude?: string;

    @ApiProperty({ example: '106.8456', required: false })
    @IsOptional()
    @IsString()
    @Matches(/^-?\d+(\.\d+)?$/, { message: 'Must be a valid decimal number' })
    longitude?: string;

    @ApiProperty({ example: 'Jl. Kebon Jeruk No. 12, Jakarta', required: false })
    @IsOptional()
    @IsString()
    address?: string;
}