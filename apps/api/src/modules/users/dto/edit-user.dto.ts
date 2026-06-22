import { ApiProperty } from '@nestjs/swagger';
import { IEditUserDto } from '@repo/dto';

export class EditUserDto implements IEditUserDto {
  @ApiProperty({ example: 'newemail@example.com', required: false })
  email?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;
}