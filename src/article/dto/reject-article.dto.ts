import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectArticleDto {
    @ApiProperty({ description: 'Article title' })
    @IsNotEmpty()
    @IsString()
    note: string;
}
