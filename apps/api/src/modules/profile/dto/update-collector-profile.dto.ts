import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Matches } from 'class-validator';
import { IUpdateCollectorProfileDto } from '@repo/dto';

export class UpdateCollectorProfileDto implements IUpdateCollectorProfileDto {
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

    @ApiProperty({ example: 'Jl. Raya Pengepul No. 7, Jakarta', required: false })
    @IsOptional()
    @IsString()
    warehouseAddress?: string;

    @ApiProperty({ example: 15.0, required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    serviceRadiusKm?: number;

    @ApiProperty({ example: 1200, required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    capacityLiter?: number;
}