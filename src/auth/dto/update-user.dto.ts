import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
    @ApiProperty()
    @IsString()
    @Length(3, 100)
    @IsOptional()
    name: string;
}
