import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
    @ApiProperty({ description: 'Tag name', maxLength: 100 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    name: string;
}
