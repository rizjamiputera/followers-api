import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
    @ApiProperty({ description: 'User name', maxLength: 100 })
    @Length(1, 100)
    @IsOptional()
    @IsString()
    name: string;

    @ApiProperty({ description: 'Warehouse ID' })
    @IsOptional()
    @IsString()
    warehouseId: string;
}
