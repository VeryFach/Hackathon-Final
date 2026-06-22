import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Matches } from 'class-validator';
import { ICreateCollectorProfileDto } from '@repo/dto';

export class CreateCollectorProfileDto implements ICreateCollectorProfileDto {
    @ApiProperty({ example: '-6.2088' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^-?\d+(\.\d+)?$/, { message: 'Must be a valid decimal number' })
    latitude!: string;

    @ApiProperty({ example: '106.8456' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^-?\d+(\.\d+)?$/, { message: 'Must be a valid decimal number' })
    longitude!: string;

    @ApiProperty({ example: 'Jl. Raya Pengepul No. 5, Jakarta' })
    @IsString()
    @IsNotEmpty()
    warehouseAddress!: string;

    @ApiProperty({ example: 10.5, description: 'Service radius in kilometers' })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    serviceRadiusKm!: number;

    @ApiProperty({ example: 1000, description: 'Capacity in liters' })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    capacityLiter!: number;
}