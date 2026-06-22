import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ICreateDepositorProfileDto } from '@repo/dto';

export class CreateDepositorProfileDto implements ICreateDepositorProfileDto {
    @ApiProperty({ example: '-6.2088', description: 'Latitude (decimal string)' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^-?\d+(\.\d+)?$/, { message: 'Must be a valid decimal number' })
    latitude!: string;

    @ApiProperty({ example: '106.8456', description: 'Longitude (decimal string)' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^-?\d+(\.\d+)?$/, { message: 'Must be a valid decimal number' })
    longitude!: string;

    @ApiProperty({ example: 'Jl. Kebon Jeruk No. 10, Jakarta' })
    @IsString()
    @IsNotEmpty()
    address!: string;
}