import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCommentDto {
    @ApiProperty({ description: 'Comment' })
    @IsNotEmpty()
    @IsString()
    content: string;
}
