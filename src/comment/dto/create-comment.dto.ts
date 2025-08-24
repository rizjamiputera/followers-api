import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
    @ApiProperty({ description: 'Content Id' })
    @IsNotEmpty()
    @IsString()
    contentId: string;

    @ApiProperty({ description: 'Parent comment Id' })
    @IsOptional()
    @IsString()
    parentId: string;

    @ApiProperty({ description: 'Mention user Id' })
    @IsOptional()
    @IsString()
    mentionedId: string;

    @ApiProperty({ description: 'Comment' })
    @IsNotEmpty()
    @IsString()
    comment: string;
}
